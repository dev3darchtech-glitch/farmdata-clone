const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Simple emulation of the watermark logic from googleDriveService.ts
function toAsciiWatermarkText(value) {
  return String(value ?? "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeSvgText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function testWatermark() {
  try {
    const inputPath = "/home/khovan/Workplaces/capture-data/cachua.webp";
    const outputPath = "/home/khovan/Workplaces/capture-data/cachua_marked_test.webp";

    const imageBuffer = fs.readFileSync(inputPath);
    const sharpImg = sharp(imageBuffer);
    const imgMetadata = await sharpImg.metadata();
    const width = imgMetadata.width || 800;
    const height = imgMetadata.height || 500;


    const dateStr = new Date().toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const email = "minhpnq1807@gmail.com";
    const plot = "L-001";
    const crop = "Ca chua";
    const disease = "Suong mai";

    const leftLines = [
      `FARMDATA`,
      `Luong: ${plot}`,
      `Cay: ${crop}`,
      `Benh: ${disease}`,
    ].map(toAsciiWatermarkText);

    const envStr = "Ngoai troi";
    const locationStr = "Vi tri: Lam Dong, Viet Nam";

    const rightLines = [
      envStr,
      locationStr,
      `${email}`,
      `${dateStr}`,
    ].map(toAsciiWatermarkText);

    // Height based on max lines in left/right (which is 4)
    const padding = 14;
    const lineHeight = Math.max(14, Math.round(height * 0.035));
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const barHeight = maxLines * lineHeight + padding * 2;
    const fontSize = Math.max(11, Math.round(lineHeight * 0.72));

    const leftTextElements = leftLines
      .map((line, idx) => {
        const yPos = height - barHeight + padding + idx * lineHeight + fontSize;
        return `<text x="16" y="${yPos}" class="watermark-text" text-anchor="start">${escapeSvgText(line)}</text>`;
      })
      .join("\n");

    const rightTextElements = rightLines
      .map((line, idx) => {
        const yPos = height - barHeight + padding + idx * lineHeight + fontSize;
        return `<text x="${width - 16}" y="${yPos}" class="watermark-text" text-anchor="end">${escapeSvgText(line)}</text>`;
      })
      .join("\n");

    const svgText = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-bar {
            fill: rgba(0, 0, 0, 0.75);
          }
          .watermark-text {
            fill: #ffffff;
            font-size: ${fontSize}px;
            font-family: sans-serif;
            font-weight: bold;
          }
        </style>
        <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}" class="watermark-bar" />
        ${leftTextElements}
        ${rightTextElements}
      </svg>
    `;

    console.log("Generating watermark test overlay SVG...");

    const logoPath = path.resolve(__dirname, "../../frontend/assets/images/logo.svg");
    let logoBuffer = null;
    try {
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (logoErr) {
      console.warn("Failed to read logo.svg file:", logoErr);
    }

    const compositeList = [
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      }
    ];

    if (logoBuffer) {
      const logoResized = await sharp(logoBuffer)
        .resize({ width: Math.max(40, Math.round(width * 0.065)) })
        .toBuffer();
      compositeList.push({
        input: logoResized,
        top: 16,
        left: width - Math.max(40, Math.round(width * 0.065)) - 16,
      });
    }

    const markedBuffer = await sharpImg
      .composite(compositeList)
      .toBuffer();

    fs.writeFileSync(outputPath, markedBuffer);
    console.log("Watermark applied successfully! Output saved to:", outputPath);
  } catch (err) {
    console.error("Error applying watermark:", err);
  }
}

testWatermark();
