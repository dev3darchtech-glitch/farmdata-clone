FarmData
SITEMAP VÀ ĐẶC TẢ MÀN HÌNH CHO UI/UX DESIGNER
Phiên bản Mobile MVP
Phạm vi: Ứng dụng chỉ có 4 screen chính: Login, Capture, Post List và Management Dashboard. Camera, bottom sheet, image viewer, sidebar, biểu mẫu và trạng thái hệ thống đều là component, không được tính thành screen riêng.

1. Mục tiêu và nguyên tắc thiết kế
   Tài liệu này là cơ sở để UI/UX Designer thiết kế giao diện mobile cho FarmData. Thiết kế phải ưu tiên thao tác nhanh, dễ sử dụng ngoài đồng ruộng và hạn chế tối đa việc chuyển màn hình.
   Mobile-only; không thiết kế desktop hoặc tablet trong phạm vi MVP.
   Nông dân chỉ sử dụng hai chức năng chính: Capture và Post.
   Toàn bộ dữ liệu của một phiên chụp được nhập trên một Capture Screen cuộn dọc.
   Post được hệ thống tự động tạo sau khi ảnh và thông tin được lưu vào database.
   Không có màn hình tạo Post, Post Detail hoặc quy trình Capture nhiều bước.
   Các lựa chọn phụ sử dụng bottom sheet, overlay, drawer hoặc modal thay vì route mới.
   Mỗi screen chỉ có một hành động chính nổi bật.
2. Phân biệt Screen và Component
   Khái niệm
   Định nghĩa
   Ví dụ trong FarmData
   Screen
   Màn hình chính có route riêng, thay đổi toàn bộ vùng nội dung của ứng dụng.
   Login, Capture, Post List, Management Dashboard
   Component
   Thành phần hiển thị hoặc tương tác nằm bên trong một screen; không có route độc lập.
   Bottom sheet, sidebar, image viewer, Post Card, form, snackbar
   State
   Biến thể trạng thái của screen hoặc component trong quá trình sử dụng.
   Loading, empty, error, import thành công, lưu phiên thất bại

Quy tắc bắt buộc: Designer chỉ tạo 4 layout screen chính. Các phần còn lại phải được tổ chức dưới dạng component, variant hoặc state trong Figma.

3. Sitemap chính thức
   Cấu trúc sitemap
   FarmData
   ├── SC-01 Login
   ├── Farmer
   │ ├── SC-02 Capture
   │ └── SC-03 Post List
   └── Admin
   ├── SC-03 Post List
   └── SC-04 Management Dashboard
   ├── Sidebar: Mã số luống
   ├── Sidebar: Loại cây
   └── Sidebar: Tài khoản

ID
Screen
Route đề xuất
Vai trò sử dụng
SC-01
Login
/login
Nông dân, Admin
SC-02
Capture
/capture
Nông dân
SC-03
Post List
/posts
Nông dân, Admin
SC-04
Management Dashboard
/management
Admin

4. Navigation theo vai trò
   4.1. Nông dân
   Nông dân sử dụng bottom navigation gồm hai tab. Sau khi đăng nhập thành công, hệ thống mở trực tiếp Capture Screen.
   [ Capture ] [ Post ]

Tab
Screen mở
Mục đích
Capture
SC-02 Capture
Chụp nhiều ảnh, nhập dữ liệu và hoàn tất phiên chụp.
Post
SC-03 Post List
Xem các Post đã được hệ thống tự động tạo.

4.2. Admin
Admin sử dụng navigation dạng sidebar. Trong thiết kế mobile, sidebar có thể hiển thị dạng off-canvas drawer mở từ biểu tượng menu, nhưng vẫn được xem là một component của Management Dashboard.
Sidebar
├── Post
└── Management
├── Mã số luống
├── Loại cây
└── Tài khoản

5. SC-01 - Login Screen
   5.1. Mục đích
   Cho phép Nông dân và Admin đăng nhập bằng username và password đã được cấp. Hệ thống tự xác định vai trò sau khi xác thực thành công.
   5.2. Component thuộc Login Screen
   Component
   Chức năng
   App Logo và App Name
   Nhận diện ứng dụng FarmData.
   Username Input
   Nhập tên đăng nhập được cấp.
   Password Input
   Nhập mật khẩu; có nút hiện hoặc ẩn mật khẩu.
   Login Button
   Thực hiện đăng nhập.
   Inline Error Message
   Hiển thị lỗi ngay dưới form, không mở màn hình khác.
   Loading State
   Khóa nút trong khi hệ thống xác thực.

5.3. Bố cục gợi ý
FarmData

Tên đăng nhập
[________________________________]

Mật khẩu
[________________________] [Hiện/ẩn]

[ Đăng nhập ]

Không có đăng ký tài khoản.
Không có chọn vai trò.
Không tạo màn hình Quên mật khẩu trong MVP.
Sai username hoặc password phải dùng một thông báo chung để tránh lộ tài khoản. 6. SC-02 - Capture Screen
6.1. Mục đích và cấu trúc
Capture là screen chính của Nông dân. Tất cả thông tin của một phiên chụp được nhập trên cùng một màn hình cuộn dọc; không sử dụng stepper và không chuyển qua nhiều screen.
Capture Screen
├── Header
├── Image Capture Section
├── Crop Information Section
├── Environment Section
├── Symptom Section
└── Complete Capture CTA

6.2. Header Component
FarmData [Avatar]
Phiên chụp mới

Avatar mở menu nhỏ gồm tên tài khoản và Đăng xuất. Không thiết kế Profile Screen riêng.
6.3. Image Capture Component
Trạng thái
Hiển thị
Tương tác
Chưa có ảnh
Nút Chụp ảnh và ghi chú có thể chụp nhiều ảnh.
Mở camera hệ thống.
Đã có ảnh
Danh sách thumbnail, số lượng ảnh và nút dấu cộng.
Xem ảnh lớn, xóa ảnh, chụp thêm, chụp lại.
Đang tải
Tiến trình tải trên từng thumbnail hoặc toàn phiên.
Không khóa việc xem lại dữ liệu đã nhập.

Ảnh cây trồng 3 ảnh
[ Ảnh 1 ] [ Ảnh 2 ] [ Ảnh 3 ] [ + ]

Không phải Screen: Camera hệ thống và Image Viewer chỉ là component/overlay. Không thiết kế một màn hình quản lý ảnh riêng.

6.4. Crop Information Component
Thông tin cây trồng

Mã số luống
[Chọn mã số luống - Không bắt buộc >]

Loại cây \*
[Chọn loại cây >]

Giai đoạn sinh trưởng \*
[Chọn một trong 5 giai đoạn >]

Trường
Bắt buộc
Component mở khi chọn
Quy tắc
Mã số luống
Không
Plot Selection Bottom Sheet
Tìm kiếm và chọn từ danh sách Admin quản lý; có lựa chọn không chọn mã.
Loại cây
Có
Crop Selection Bottom Sheet
Tìm kiếm và chọn từ Master Data; không nhập giá trị tự do trong MVP.
Giai đoạn sinh trưởng
Có
Growth Stage Bottom Sheet
Chọn một trong 5 giai đoạn; bottom sheet tự đóng sau khi chọn.

6.5. Environment Component
Loại môi trường sử dụng segmented control để chọn bằng một lần chạm.
Môi trường \*
[ Ngoài trời ] [ Nhà kính ]

Dữ liệu trạm được lấy tự động từ API. Capture Screen chỉ hiển thị tóm tắt; chi tiết T0, T-24 và T-48 mở bằng Station Data Bottom Sheet.
Dữ liệu trạm
Trạm DN-01 - Cập nhật 08:30
Nắng - 29°C - Độ ẩm 74% [Xem thêm]

Nguồn
Thông số
Trạm từ API
Loại thời tiết; nhiệt độ; độ ẩm; ánh sáng; tốc độ gió tại T0; CO2; dữ liệu T0, T-24 và T-48 theo khả năng API.
Số đo tại nơi
Loại thời tiết; nhiệt độ; độ ẩm; ánh sáng; tốc độ gió; CO2; pH; EC; DO; độ ẩm đất.

6.6. Local Measurement Component
Trên Capture Screen chỉ hiển thị trạng thái Chưa nhập hoặc Đã nhập. Chạm Nhập/Chỉnh sửa để mở Local Measurement Bottom Sheet toàn chiều cao.
Số đo tại nơi
Chưa nhập [Nhập]

Nhóm
Trường nhập
Không khí và môi trường
Loại thời tiết, nhiệt độ, độ ẩm không khí, ánh sáng, tốc độ gió, CO2.
Chỉ số đất
pH, EC, DO, độ ẩm đất.

Tối giản thao tác: Dùng bàn phím số cho trường số, đơn vị hiển thị cố định bên phải và không yêu cầu người dùng tự nhập đơn vị.

6.7. Symptom Component
Triệu chứng

Mô tả triệu chứng \*
[Nhập triệu chứng quan sát được.........................]

Mức độ \*
[Chớm] [Nhẹ] [Vừa] [Nặng] [Rất nặng]

Mức độ
Diện tích lá bị ảnh hưởng
Chớm bệnh
Từ 1% đến 10%
Nhẹ
Trên 10% đến 25%
Vừa
Trên 25% đến 50%
Nặng
Trên 50% đến 75%
Rất nặng
Trên 75%

Phải có chú thích: “Mức độ được tính theo tổng diện tích lá bị ảnh hưởng và tăng dần theo tỷ lệ phần trăm.”
6.8. Complete Capture Component
[ Hoàn tất phiên chụp ]

Nút được cố định ở cuối screen và chỉ kích hoạt khi có đủ dữ liệu bắt buộc:
Ít nhất một ảnh.
Loại cây.
Giai đoạn sinh trưởng.
Loại môi trường.
Mô tả triệu chứng.
Mức độ triệu chứng.
Mã số luống và số đo tại nơi không bắt buộc.
6.9. Auto Post và trạng thái hệ thống

1. Kiểm tra dữ liệu bắt buộc.
2. Tải toàn bộ ảnh lên storage.
3. Lưu Capture Session và metadata vào database.
4. Liên kết các ảnh với Capture Session.
5. Backend tự động tạo Post từ dữ liệu phiên chụp.
6. Hiển thị Post trong Post List.
   State/Component
   Nội dung hiển thị
   Hành động
   Loading Overlay
   Đang lưu phiên chụp; hiển thị tiến trình tải ảnh.
   Không chuyển sang screen mới.
   Success Bottom Sheet
   Đã lưu phiên chụp; Post đã được tự động tạo.
   Chụp phiên mới hoặc chuyển sang tab Post.
   Error Bottom Sheet
   Chưa thể lưu phiên chụp; dữ liệu vẫn được giữ lại.
   Thử lại.

7. SC-03 - Post List Screen
   7.1. Mục đích
   Post List hiển thị các Post được hệ thống tự động tạo từ Capture Session. Không có Post Detail Screen và không cho người dùng tạo Post thủ công.
   Post
   [Tìm mã luống hoặc loại cây...........................]
   [Tất cả] [Ngoài trời] [Nhà kính]

[Ảnh đại diện] +3 ảnh
Cà chua - Giai đoạn 3
L-001 - Nhà kính
Đốm vàng - Mức độ vừa
23/07/2026 - 08:45

7.2. Component thuộc Post List
Component
Nông dân
Admin
Header và Search Bar
Tìm mã luống hoặc loại cây.
Tìm mã luống, loại cây hoặc tài khoản.
Filter
Chip Tất cả, Ngoài trời, Nhà kính.
Nút lọc mở Filter Bottom Sheet nâng cao.
Post Card
Chỉ hiển thị Post của tài khoản đang đăng nhập.
Hiển thị toàn bộ Post và thêm tên người gửi.
Image Viewer
Chạm ảnh để xem toàn màn hình và vuốt giữa các ảnh.
Tương tự Nông dân.
States
Loading, empty, error.
Loading, empty, error.

7.3. Post Card Component
Mỗi Post Card phải hiển thị đủ dữ liệu nhận diện nhưng không biến thành trang chi tiết:
Ảnh đại diện và tổng số ảnh.
Mã số luống nếu có.
Loại cây và giai đoạn sinh trưởng.
Ngoài trời hoặc nhà kính.
Triệu chứng rút gọn và mức độ.
Thời gian ghi nhận.
Tên người gửi đối với Admin.
Không có Post Detail: Chạm vào ảnh chỉ mở Image Viewer. Card không điều hướng đến một route hoặc screen chi tiết.

7.4. Image Viewer và nhãn ảnh
Image Viewer là overlay của Post List. Người dùng có thể vuốt qua các ảnh trong cùng Post, phóng to/thu nhỏ và đóng để quay lại danh sách.
Nhãn overlay trên ảnh
L-001 - Cà chua
Giai đoạn 3 - Nhà kính
Đốm vàng - Mức độ vừa

Nhãn được tạo tự động từ Capture Session.
Không yêu cầu người dùng kéo hoặc căn chỉnh.
Không ghi đè vào ảnh gốc trong storage.
Nếu không có mã luống, bỏ dòng mã luống thay vì hiển thị “Không có mã”. 8. SC-04 - Management Dashboard Screen
8.1. Mục đích và bố cục
Management Dashboard là screen duy nhất dành cho các nghiệp vụ quản lý của Admin. Mã số luống, loại cây và tài khoản chỉ là các nội dung/variant được thay đổi trong cùng screen.
Management Dashboard
├── Sidebar / Mobile Drawer
├── Header
├── Search Bar
├── Toolbar: Import CSV | Thêm
├── Data List
├── Action Menu
└── Add/Edit Bottom Sheet

8.2. Sidebar Component
FarmData

Post
Management

- Mã số luống
- Loại cây
- Tài khoản

[Avatar / Đăng xuất]

Trên mobile, sidebar có thể là drawer trượt từ cạnh trái. Việc chọn mục chỉ thay đổi nội dung chính của Management Dashboard, không tạo route quản lý mới.
8.3. Management Variants
Variant
Dữ liệu danh sách
Form thêm/sửa
Mã số luống
Mã luống và trạng thái.
Mã số luống.
Loại cây
Tên loại cây và trạng thái.
Tên loại cây.
Tài khoản
Mã cấp, username và trạng thái.
Mã cấp, username, mật khẩu tạm thời.

8.4. Toolbar và Data List Component
Mã số luống
[Tìm kiếm.............................................]
[Import CSV] [+ Thêm]

L-001 [⋮]
L-002 [⋮]
L-003 [⋮]

Loại cây và Tài khoản sử dụng cùng layout, chỉ thay đổi label, dữ liệu và trường form.
8.5. Add/Edit và Action Menu Components
Component
Hành vi
Add/Edit Bottom Sheet
Mở trên Management Dashboard; lưu thành công thì đóng sheet và cập nhật danh sách.
Action Menu
Mở từ nút ba chấm; gồm Chỉnh sửa, Ngừng sử dụng/Khóa tài khoản và Đặt lại mật khẩu khi phù hợp.
Confirm Dialog
Chỉ dùng cho hành động có ảnh hưởng như khóa hoặc ngừng sử dụng.

8.6. Import CSV Component
Import CSV chỉ là một button trong toolbar, không phải screen và không cần flow nhiều bước.

1. Admin chạm Import CSV.
2. Ứng dụng mở file picker của thiết bị.
3. Admin chọn một file .csv.
4. Hệ thống kiểm tra và import ở nền của screen hiện tại.
5. Danh sách được cập nhật và hiển thị snackbar kết quả.
   Trạng thái
   Cách hiển thị
   Đang import
   Progress nhỏ ngay dưới toolbar hoặc trên button.
   Thành công
   Snackbar: số bản ghi đã import thành công.
   Có dòng lỗi
   Bottom sheet kết quả gồm số dòng thành công, số dòng lỗi và mô tả lỗi.
   Thất bại
   Snackbar hoặc alert nhỏ; vẫn ở Management Dashboard.

Không thiết kế: Không có CSV Import Screen, CSV Preview Screen, CSV Validation Screen hoặc CSV Confirmation Screen.

9. Screen - Component Mapping
   Screen
   Component chính
   SC-01 Login
   Logo, username input, password input, show/hide password, login button, inline error, loading.
   SC-02 Capture
   Header, camera trigger, thumbnail list, selection bottom sheets, station card, local measurement sheet, symptom form, severity selector, CTA, loading/success/error states.
   SC-03 Post List
   Header, search, filter, Post Card, Image Viewer, loading/empty/error states.
   SC-04 Management Dashboard
   Sidebar/drawer, management variants, toolbar, search, data list, action menu, add/edit bottom sheet, CSV button, import states.

10. Danh sách Component cần thiết kế
    10.1. Component dùng chung
    App Header và Avatar Menu.
    Bottom Navigation.
    Sidebar/Mobile Drawer.
    Button, Icon Button, Input và Search Bar.
    Segmented Control và Filter Chip.
    Bottom Sheet, Snackbar, Confirm Dialog.
    Loading, Empty và Error State.
    10.2. Component của Capture
    Image Capture, Image Thumbnail và Image Viewer.
    Plot Selection, Crop Selection và Growth Stage Selection Bottom Sheet.
    Environment Type Selector.
    Station Data Card và Station Data Bottom Sheet.
    Local Measurement Bottom Sheet.
    Symptom Input và Severity Selector.
    Complete Capture CTA.
    Capture Loading Overlay, Success Bottom Sheet và Error Bottom Sheet.
    10.3. Component của Post List
    Post Search và Post Filter.
    Post Card và image count badge.
    Image Viewer có carousel và zoom.
    Post List loading, empty và error states.
    10.4. Component của Management Dashboard
    Management Sidebar/Mobile Drawer.
    Management Toolbar và Search.
    Data List, Data Row và status badge.
    Action Menu.
    Add/Edit Bottom Sheet và Account Form.
    Import CSV Button, Import Progress, Snackbar và Import Result Bottom Sheet.
11. Nội dung không được tính là Screen
    Không phải Screen
    Phân loại đúng
    Camera
    Component hệ thống được mở từ Capture.
    Image Viewer
    Overlay component của Capture hoặc Post List.
    Post Detail
    Không tồn tại trong MVP.
    Bottom sheet chọn mã luống, loại cây, giai đoạn
    Component của Capture.
    Station Data và Local Measurement Form
    Bottom sheet/component của Capture.
    Success, error, loading
    State hoặc feedback component.
    Sidebar
    Navigation component của Management Dashboard.
    Danh sách mã luống, loại cây, tài khoản
    Variant nội dung của Management Dashboard.
    Import CSV và kết quả import
    Button và feedback component của Management Dashboard.

12. Checklist bàn giao Figma
    Hạng mục
    Yêu cầu
    Screen layouts
    Đủ 4 screen: Login, Capture, Post List, Management Dashboard.
    Role variants
    Post List có variant Nông dân và Admin; navigation thay đổi theo quyền.
    Component variants
    Đủ normal, selected, disabled, loading, error và empty khi phù hợp.
    Capture flow
    Có prototype từ Chụp ảnh đến Hoàn tất phiên chụp và Auto Post thành công.
    Management flow
    Có prototype đổi mục sidebar, thêm/sửa dữ liệu và import CSV bằng button.
    Developer handoff
    Tên layer/component rõ ràng, sử dụng Auto Layout, spacing nhất quán và có thông số kích thước.
    Không làm dư
    Không tạo Post Detail hoặc các screen riêng cho bottom sheet, camera và CSV.
