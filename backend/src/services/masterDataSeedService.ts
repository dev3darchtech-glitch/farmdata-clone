import mongoose from "mongoose";
import { CropModel } from "../models/Crop";
import { PlantDiseaseModel } from "../models/PlantDisease";
import { PlotModel } from "../models/Plot";
import { PlantDiseaseGroup } from "../types";

const DEFAULT_PLOTS = [
  { code: "L-001", name: "Luống 01 - Khu A (Nhà kính)", envMode: "greenhouse" },
  { code: "L-002", name: "Luống 02 - Khu A (Nhà kính)", envMode: "greenhouse" },
  { code: "L-003", name: "Luống 03 - Khu B (Ngoài trời)", envMode: "outdoor" },
] as const;

const DEFAULT_CROPS = [
  { name: "Cà chua", category: "Rau ăn quả", icon: "🍅" },
  { name: "Dưa leo", category: "Rau ăn quả", icon: "🥒" },
  { name: "Ớt chuông", category: "Rau ăn quả", icon: "🫑" },
  { name: "Bắp cải", category: "Rau ăn lá", icon: "🥬" },
] as const;

type DefaultPlantDisease = {
  group: PlantDiseaseGroup;
  type: string;
  name: string;
};

const DEFAULT_PLANT_DISEASES: DefaultPlantDisease[] = [
  { group: "Truyền nhiễm", type: "Nấm", name: "Sương mai" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Phấn trắng" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Thán thư" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Đốm lá Cercospora" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Mốc xám Botrytis" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Héo rũ Fusarium" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Héo rũ Verticillium" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Thối rễ Phytophthora" },
  { group: "Truyền nhiễm", type: "Nấm", name: "Lở cổ rễ" },
  { group: "Truyền nhiễm", type: "Vi khuẩn", name: "Đốm vi khuẩn" },
  { group: "Truyền nhiễm", type: "Vi khuẩn", name: "Héo xanh vi khuẩn" },
  { group: "Truyền nhiễm", type: "Vi khuẩn", name: "Thối nhũn vi khuẩn" },
  { group: "Truyền nhiễm", type: "Vi khuẩn", name: "Loét vi khuẩn" },
  { group: "Truyền nhiễm", type: "Vi rút", name: "Bệnh khảm lá" },
  { group: "Truyền nhiễm", type: "Vi rút", name: "Xoăn vàng lá" },
  { group: "Truyền nhiễm", type: "Vi rút", name: "Đốm héo vàng" },
  { group: "Truyền nhiễm", type: "Vi rút", name: "Lùn sọc đen" },
  { group: "Truyền nhiễm", type: "Tuyến trùng", name: "Sưng rễ tuyến trùng" },
  {
    group: "Truyền nhiễm",
    type: "Tuyến trùng",
    name: "Tổn thương rễ do tuyến trùng",
  },
  {
    group: "Truyền nhiễm",
    type: "Tuyến trùng",
    name: "Còi cọc do tuyến trùng",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thiếu dinh dưỡng",
    name: "Thiếu đạm (N)",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thiếu dinh dưỡng",
    name: "Thiếu lân (P)",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thiếu dinh dưỡng",
    name: "Thiếu kali (K)",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thiếu dinh dưỡng",
    name: "Thiếu canxi (Ca)",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thiếu dinh dưỡng",
    name: "Thiếu magie (Mg)",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thiếu dinh dưỡng",
    name: "Thiếu sắt (Fe)",
  },
  { group: "Không truyền nhiễm", type: "Thừa dinh dưỡng", name: "Thừa đạm" },
  {
    group: "Không truyền nhiễm",
    type: "Thừa dinh dưỡng",
    name: "Ngộ độc muối/khoáng",
  },
  {
    group: "Không truyền nhiễm",
    type: "Thừa dinh dưỡng",
    name: "Cháy rễ do phân bón",
  },
  { group: "Không truyền nhiễm", type: "Bệnh thời tiết", name: "Cháy nắng" },
  { group: "Không truyền nhiễm", type: "Bệnh thời tiết", name: "Sốc nhiệt" },
  {
    group: "Không truyền nhiễm",
    type: "Bệnh thời tiết",
    name: "Tổn thương rét",
  },
  {
    group: "Không truyền nhiễm",
    type: "Bệnh thời tiết",
    name: "Úng nước sau mưa",
  },
  {
    group: "Không truyền nhiễm",
    type: "Đất không phù hợp",
    name: "pH đất không phù hợp",
  },
  {
    group: "Không truyền nhiễm",
    type: "Đất không phù hợp",
    name: "Đất nén chặt",
  },
  {
    group: "Không truyền nhiễm",
    type: "Đất không phù hợp",
    name: "Thoát nước kém",
  },
];

export async function seedDefaultMasterDataForAdmin(
  adminId: mongoose.Types.ObjectId | string,
) {
  const normalizedAdminId =
    typeof adminId === "string"
      ? new mongoose.Types.ObjectId(adminId)
      : adminId;

  await Promise.all([
    PlotModel.bulkWrite(
      DEFAULT_PLOTS.map((plot) => ({
        updateOne: {
          filter: { code: plot.code, createdByAdminId: normalizedAdminId },
          update: {
            $setOnInsert: { ...plot, createdByAdminId: normalizedAdminId },
          },
          upsert: true,
        },
      })),
    ),
    CropModel.bulkWrite(
      DEFAULT_CROPS.map((crop) => ({
        updateOne: {
          filter: { name: crop.name, createdByAdminId: normalizedAdminId },
          update: {
            $setOnInsert: { ...crop, createdByAdminId: normalizedAdminId },
          },
          upsert: true,
        },
      })),
    ),
    PlantDiseaseModel.bulkWrite(
      DEFAULT_PLANT_DISEASES.map((disease) => ({
        updateOne: {
          filter: {
            group: disease.group,
            type: disease.type,
            name: disease.name,
            createdByAdminId: normalizedAdminId,
          },
          update: {
            $setOnInsert: {
              ...disease,
              createdByAdminId: normalizedAdminId,
            },
          },
          upsert: true,
        },
      })),
    ),
  ]);
}
