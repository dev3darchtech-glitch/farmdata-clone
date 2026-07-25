import { WeatherCondition } from "@/types";
import React, { useState } from "react";
import { Text, View, Pressable, Modal } from "react-native";

export function WeatherTelemetryBanner({
  current,
  weather,
}: {
  current?: WeatherCondition;
  weather?: WeatherCondition;
  envMode?: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const data = current || weather;

  return (
    <View testID="weather-telemetry-banner">
      <Text>Trạm DN-01</Text>
      <Text>{data ? `${data.temperature}°C` : "Đang tải dữ liệu"}</Text>

      <Pressable onPress={() => setModalVisible(true)}>
        <Text>Xem thêm chi tiết &gt;</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Chi Tiết Thông Số Telemetry</Text>
            {data ? (
              <View style={{ marginBottom: 20 }}>
                <Text>Nhiệt độ: {data.temperature}°C</Text>
                <Text>Độ ẩm: {data.humidity}%</Text>
                {data.windSpeed !== undefined && <Text>Tốc độ gió: {data.windSpeed} km/h</Text>}
                {data.lightUvIndex !== undefined && <Text>Ánh sáng: {data.lightUvIndex} lx</Text>}
                {data.co2Level !== undefined && <Text>CO2: {data.co2Level} ppm</Text>}
              </View>
            ) : (
              <Text style={{ marginBottom: 20 }}>Không có dữ liệu</Text>
            )}
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#10b981", fontWeight: "bold", textAlign: "center" }}>Đóng bảng thông số</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
