$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$output = Join-Path $PSScriptRoot "Do_an_He_thong_quan_ly_cho_thue_xe_V2.pptx"
$homeImage = Join-Path $PSScriptRoot "home.png"
$carsImage = Join-Path $PSScriptRoot "cars.png"
$logoImage = Join-Path $root "frontend\public\image\brand\logo.png"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$presentation = $ppt.Presentations.Add()
$presentation.PageSetup.SlideWidth = 960
$presentation.PageSetup.SlideHeight = 540

$C = @{
    Bg = 0x142018
    Bg2 = 0x1D2D24
    Card = 0x294638
    Card2 = 0x345447
    Green = 0x98E600
    Green2 = 0x72C900
    White = 0xFFFFFF
    Muted = 0xB8C9C1
    Dark = 0x101714
    Amber = 0x48B2FF
    Red = 0x686BFF
    Blue = 0xFFB04F
}

function Add-Shape($slide, $type, $x, $y, $w, $h, $fill, $line = $null, $radius = $false) {
    $shapeType = if ($radius) { 5 } else { $type }
    $s = $slide.Shapes.AddShape($shapeType, $x, $y, $w, $h)
    if ($null -eq $s -or $null -eq $s.Fill -or $null -eq $fill) {
        throw "Add-Shape failed on slide $($slide.SlideIndex): type=$shapeType x=$x y=$y w=$w h=$h fill=$fill"
    }
    $s.Fill.ForeColor.RGB = $fill
    $s.Fill.Solid()
    if ($null -eq $line) { $s.Line.Visible = 0 } else { $s.Line.ForeColor.RGB = $line }
    return $s
}

function Add-Text($slide, $text, $x, $y, $w, $h, $size = 18, $color = $C.White, $bold = $false, $font = "Aptos", $align = 1) {
    $box = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
    $box.TextFrame2.MarginLeft = 0
    $box.TextFrame2.MarginRight = 0
    $box.TextFrame2.MarginTop = 0
    $box.TextFrame2.MarginBottom = 0
    $box.TextFrame2.WordWrap = -1
    $box.TextFrame2.TextRange.Text = $text
    $box.TextFrame2.TextRange.Font.Name = $font
    $box.TextFrame2.TextRange.Font.Size = $size
    $box.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = $color
    $box.TextFrame2.TextRange.Font.Bold = if ($bold) { -1 } else { 0 }
    $box.TextFrame2.TextRange.ParagraphFormat.Alignment = $align
    return $box
}

function Add-Line($slide, $x1, $y1, $x2, $y2, $color = $C.Green, $weight = 2, $arrow = $false) {
    $l = $slide.Shapes.AddLine($x1, $y1, $x2, $y2)
    $l.Line.ForeColor.RGB = $color
    $l.Line.Weight = [single]$weight
    if ($arrow) { $l.Line.EndArrowheadStyle = 3 }
    return $l
}

function Add-Pill($slide, $text, $x, $y, $w, $fill = $C.Green, $textColor = $C.Dark) {
    Add-Shape $slide 1 $x $y $w 24 $fill $null $true | Out-Null
    Add-Text $slide $text ($x + 7) ($y + 3) ($w - 14) 18 13 $textColor $true "Aptos" 2 | Out-Null
}

function Add-Title($slide, $kicker, $title, $num) {
    Add-Pill $slide $kicker 46 28 128
    Add-Text $slide $title 46 62 830 48 32 $C.White $true | Out-Null
    Add-Text $slide ("{0:D2}" -f $num) 893 32 28 18 12 $C.Muted $true "Aptos" 3 | Out-Null
    Add-Line $slide 46 113 914 113 $C.Card2 1 | Out-Null
}

function Add-Card($slide, $x, $y, $w, $h, $title, $body, $accent = $C.Green) {
    Add-Shape $slide 1 $x $y $w $h $C.Card $null $true | Out-Null
    Add-Shape $slide 1 $x $y 5 $h $accent | Out-Null
    Add-Text $slide $title ($x + 18) ($y + 14) ($w - 34) 28 19 $C.White $true | Out-Null
    $bodyY = if ($h -lt 80) { $y + 35 } else { $y + 48 }
    $bodyH = [Math]::Max(14, $h - ($bodyY - $y) - 8)
    $bodySize = if ($h -lt 80) { 13 } else { 16 }
    Add-Text $slide $body ($x + 18) $bodyY ($w - 34) $bodyH $bodySize $C.Muted $false | Out-Null
}

function Add-Footer($slide, $label = "CAR RENTAL MANAGEMENT SYSTEM") {
    Add-Text $slide $label 46 513 650 14 9 $C.Muted $true | Out-Null
}

function New-Slide() {
    $s = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    $s.FollowMasterBackground = 0
    $s.Background.Fill.ForeColor.RGB = $C.Bg
    $s.Background.Fill.Solid()
    return $s
}

# V2: projection-first layout. Body text is intentionally sparse and large.

# Slide 1
$s = New-Slide
$s.Shapes.AddPicture($homeImage, 0, -1, 0, 0, 960, 600) | Out-Null
$cover = Add-Shape $s 1 0 0 960 540 $C.Bg
$cover.Fill.Transparency = 0.08
Add-Pill $s "ĐỒ ÁN TỐT NGHIỆP" 54 42 174
Add-Text $s "HỆ THỐNG QUẢN LÝ`nCHO THUÊ XE" 54 105 610 108 40 $C.White $true | Out-Null
Add-Text $s "Số hóa hành trình từ tìm xe đến hoàn tất hợp đồng" 58 232 620 32 20 $C.Muted | Out-Null
Add-Shape $s 1 54 304 610 132 $C.Card $null $true | Out-Null
Add-Text $s "GVHD" 78 328 92 24 16 $C.Green $true | Out-Null
Add-Text $s "[Điền tên giảng viên]" 182 326 430 28 19 $C.White $true | Out-Null
Add-Text $s "SVTH" 78 370 92 24 16 $C.Green $true | Out-Null
Add-Text $s "Phạm Công Minh  ·  [Xác nhận]" 182 368 430 28 19 $C.White $true | Out-Null
Add-Text $s "LỚP" 78 412 92 24 16 $C.Green $true | Out-Null
Add-Text $s "[Điền tên lớp]" 182 410 430 28 19 $C.White $true | Out-Null
Add-Text $s "2026" 834 475 82 26 20 $C.Green $true "Aptos" 3 | Out-Null

# Slide 2
$s = New-Slide
Add-Title $s "BỐI CẢNH" "Vì sao chọn đề tài?" 2
Add-Shape $s 1 48 145 412 322 $C.Card $null $true | Out-Null
Add-Text $s "VẤN ĐỀ" 74 169 190 25 17 $C.Amber $true | Out-Null
$problems = @(
    @("01", "Dữ liệu phân tán", "Khó theo dõi xe, khách và thanh toán."),
    @("02", "Dễ trùng lịch", "Xử lý thủ công tiềm ẩn double-booking."),
    @("03", "Thiếu báo cáo", "Khó đánh giá doanh thu và hiệu suất xe.")
)
$yy = 214
foreach ($item in $problems) {
    Add-Text $s $item[0] 74 $yy 48 29 20 $C.Amber $true | Out-Null
    Add-Text $s $item[1] 132 ($yy - 1) 276 24 19 $C.White $true | Out-Null
    Add-Text $s $item[2] 132 ($yy + 27) 280 32 16 $C.Muted | Out-Null
    $yy += 78
}
Add-Shape $s 1 500 145 412 322 $C.Bg2 $C.Green $true | Out-Null
Add-Text $s "MỤC TIÊU" 526 169 190 25 17 $C.Green $true | Out-Null
$goals = @(
    "Quản lý tập trung toàn bộ nghiệp vụ",
    "Cho phép khách tự tìm và đặt xe 24/7",
    "Ngăn trùng lịch xe và lịch khách",
    "Hỗ trợ ra quyết định bằng dashboard"
)
$yy = 220
foreach ($goal in $goals) {
    Add-Shape $s 9 526 ($yy + 2) 28 28 $C.Green | Out-Null
    Add-Text $s "✓" 532 ($yy + 6) 16 16 13 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $goal 570 $yy 308 40 18 $C.White $true | Out-Null
    $yy += 58
}
Add-Footer $s

# Slide 3
$s = New-Slide
Add-Title $s "CÔNG NGHỆ" "Kiến trúc hệ thống 3 lớp" 3
$layers = @(
    @("01", "FRONTEND", "React 19`nVite · React Router", $C.Green),
    @("02", "BACKEND", "FastAPI`nREST API · Pydantic", $C.Blue),
    @("03", "DATABASE", "SQLAlchemy ORM`nPostgreSQL", $C.Amber)
)
$xx = 50
foreach ($layer in $layers) {
    Add-Shape $s 1 $xx 164 252 220 $C.Card $null $true | Out-Null
    Add-Shape $s 9 ($xx + 82) 187 88 88 $layer[3] | Out-Null
    Add-Text $s $layer[0] ($xx + 105) 211 42 27 21 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $layer[1] ($xx + 20) 296 212 28 21 $C.White $true "Aptos" 2 | Out-Null
    Add-Text $s $layer[2] ($xx + 20) 335 212 44 17 $C.Muted $false "Aptos" 2 | Out-Null
    if ($xx -lt 600) { Add-Line $s ($xx + 260) 274 ($xx + 292) 274 $C.Green 3 $true | Out-Null }
    $xx += 304
}
Add-Shape $s 1 112 421 736 58 $C.Bg2 $C.Card2 $true | Out-Null
Add-Text $s "BẢO MẬT" 136 438 110 22 16 $C.Green $true | Out-Null
Add-Text $s "JWT  ·  PBKDF2-SHA256" 258 436 250 26 18 $C.White $true | Out-Null
Add-Text $s "BÁO CÁO" 558 438 110 22 16 $C.Green $true | Out-Null
Add-Text $s "CSV  ·  Excel" 681 436 140 26 18 $C.White $true | Out-Null
Add-Footer $s

# Slide 4
$s = New-Slide
Add-Title $s "PHÂN TÍCH" "Luồng nghiệp vụ xuyên suốt" 4
$actors = @(
    @("KHÁCH HÀNG", "Tìm xe · Đặt xe · Theo dõi", $C.Green),
    @("NHÂN VIÊN", "Duyệt · Thu tiền · Hỗ trợ", $C.Blue),
    @("QUẢN TRỊ", "Quản lý · Báo cáo · Phân quyền", $C.Amber)
)
$xx = 50
foreach ($actor in $actors) {
    Add-Shape $s 1 $xx 144 272 78 $C.Card $null $true | Out-Null
    Add-Shape $s 1 $xx 144 7 78 $actor[2] | Out-Null
    Add-Text $s $actor[0] ($xx + 22) 158 226 23 18 $C.White $true | Out-Null
    Add-Text $s $actor[1] ($xx + 22) 188 226 22 15 $C.Muted | Out-Null
    $xx += 294
}
Add-Text $s "QUY TRÌNH THUÊ XE" 50 260 300 24 17 $C.Green $true | Out-Null
$steps = @("CHỌN XE", "KIỂM TRA`nLỊCH", "GIỮ CHỖ", "DUYỆT", "THANH`nTOÁN", "HỢP ĐỒNG", "TRẢ XE")
$xx = 50
for ($i = 0; $i -lt $steps.Count; $i++) {
    $fill = if ($i -eq 1) { $C.Green } else { $C.Bg2 }
    $color = if ($i -eq 1) { $C.Dark } else { $C.White }
    Add-Shape $s 1 $xx 312 104 82 $fill $(if ($i -eq 1) { $null } else { $C.Card2 }) $true | Out-Null
    Add-Text $s ("0{0}" -f ($i + 1)) ($xx + 12) 323 32 18 14 $(if ($i -eq 1) { $C.Dark } else { $C.Green }) $true | Out-Null
    Add-Text $s $steps[$i] ($xx + 10) 350 84 33 16 $color $true "Aptos" 2 | Out-Null
    if ($i -lt 6) { Add-Line $s ($xx + 108) 353 ($xx + 124) 353 $C.Green 2 $true | Out-Null }
    $xx += 125
}
Add-Shape $s 1 168 431 624 48 $C.Card $null $true | Out-Null
Add-Text $s "Trạng thái được đồng bộ giữa xe, yêu cầu thuê, thanh toán và hợp đồng" 188 445 584 22 17 $C.White $true "Aptos" 2 | Out-Null
Add-Footer $s

# Slide 5
$s = New-Slide
Add-Title $s "THIẾT KẾ" "Mô hình dữ liệu cốt lõi" 5
function Add-EntityV2($slide, $x, $y, $w, $title, $fields, $accent) {
    Add-Shape $slide 1 $x $y $w 132 $C.Card $C.Card2 $true | Out-Null
    Add-Shape $slide 1 $x $y $w 38 $accent $null $true | Out-Null
    Add-Text $slide $title ($x + 14) ($y + 9) ($w - 28) 22 17 $C.Dark $true | Out-Null
    Add-Text $slide ($fields -join "`n") ($x + 14) ($y + 50) ($w - 28) 70 15 $C.Muted | Out-Null
}
Add-EntityV2 $s 50 150 174 "CUSTOMER" @("PK customer_id", "name · phone · email") $C.Green
Add-EntityV2 $s 264 150 190 "RENTAL REQUEST" @("PK request_id", "FK customer_id · car_id") $C.Amber
Add-EntityV2 $s 494 150 174 "CAR" @("PK car_id", "price · status · plate") $C.Green
Add-EntityV2 $s 708 150 202 "CONTRACT" @("PK contract_id", "FK request_id (unique)") $C.Amber
Add-Line $s 224 216 264 216 $C.Green 3 $true | Out-Null
Add-Line $s 454 216 494 216 $C.Green 3 $true | Out-Null
Add-Line $s 668 216 708 216 $C.Green 3 $true | Out-Null
Add-EntityV2 $s 264 340 190 "PAYMENT" @("FK request_id", "amount · type · status") $C.Blue
Add-EntityV2 $s 494 340 174 "SUPPORT CHAT" @("FK customer_id", "message · sender") $C.Blue
Add-Line $s 359 282 359 340 $C.Blue 3 $true | Out-Null
Add-Line $s 581 282 581 340 $C.Blue 3 $true | Out-Null
Add-Text $s "Quan hệ trung tâm" 50 361 170 22 17 $C.Green $true | Out-Null
Add-Text $s "Customer + Car → Request → Payment → Contract" 50 393 185 74 17 $C.White $true | Out-Null
Add-Footer $s

# Slide 6
$s = New-Slide
Add-Title $s "TRIỂN KHAI" "Giao diện thực tế của hệ thống" 6
Add-Shape $s 1 48 143 414 300 $C.Card $null $true | Out-Null
$s.Shapes.AddPicture($homeImage, 0, -1, 60, 155, 390, 244) | Out-Null
Add-Text $s "01  TRANG CHỦ" 72 411 240 26 18 $C.Green $true | Out-Null
Add-Shape $s 1 498 143 414 300 $C.Card $null $true | Out-Null
$s.Shapes.AddPicture($carsImage, 0, -1, 510, 155, 390, 244) | Out-Null
Add-Text $s "02  DANH MỤC & BỘ LỌC" 522 411 310 26 18 $C.Green $true | Out-Null
Add-Text $s "Responsive" 72 468 150 23 17 $C.White $true | Out-Null
Add-Text $s "Tìm kiếm đa tiêu chí" 364 468 220 23 17 $C.White $true | Out-Null
Add-Text $s "Giá và trạng thái rõ ràng" 682 468 230 23 17 $C.White $true | Out-Null
Add-Footer $s

# Slide 7
$s = New-Slide
Add-Title $s "THUẬT TOÁN" "Điểm nổi bật: chống trùng lịch" 7
Add-Shape $s 1 50 145 514 322 $C.Card $null $true | Out-Null
Add-Text $s "ĐIỀU KIỆN GIAO NHAU" 76 171 360 25 17 $C.Green $true | Out-Null
Add-Shape $s 1 76 216 462 92 $C.Bg2 $C.Card2 $true | Out-Null
Add-Text $s "start_cũ ≤ end_mới`nAND  end_cũ ≥ start_mới" 90 235 434 57 24 $C.White $true "Consolas" 2 | Out-Null
$checks = @("Ngày thuê hợp lệ", "Xe đang khả dụng", "Không trùng lịch xe", "Không trùng lịch khách")
$yy = 335
$xx = 76
foreach ($check in $checks) {
    Add-Shape $s 9 $xx ($yy + 1) 26 26 $C.Green | Out-Null
    Add-Text $s "✓" ($xx + 5) ($yy + 5) 16 15 12 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $check ($xx + 37) $yy 174 30 16 $C.White $true | Out-Null
    if ($xx -gt 200) { $xx = 76; $yy += 58 } else { $xx = 302 }
}
Add-Shape $s 1 598 145 314 322 $C.Bg2 $C.Green $true | Out-Null
Add-Text $s "TÍNH TIỀN" 624 171 220 25 17 $C.Green $true | Out-Null
Add-Text $s "Tổng tiền" 624 221 120 22 16 $C.Muted $true | Out-Null
Add-Text $s "Phí thuê + VAT 8%" 624 250 250 28 20 $C.White $true | Out-Null
Add-Line $s 624 294 878 294 $C.Card2 1 | Out-Null
Add-Text $s "Giữ chỗ" 624 316 120 22 16 $C.Muted $true | Out-Null
Add-Text $s "20% tổng tiền" 624 346 250 28 22 $C.Green $true | Out-Null
Add-Text $s "Tối thiểu 300.000đ" 624 385 250 24 18 $C.White $true | Out-Null
Add-Text $s "→ Giảm rủi ro double-booking" 624 430 260 22 17 $C.Muted $true | Out-Null
Add-Footer $s

# Slide 8
$s = New-Slide
Add-Title $s "KẾT QUẢ" "Kiểm thử và mức độ hoàn thiện" 8
Add-Shape $s 9 70 157 260 260 $C.Green | Out-Null
Add-Text $s "7/7" 106 216 188 64 48 $C.Dark $true "Aptos" 2 | Out-Null
Add-Text $s "KIỂM THỬ LOGIC`nĐẠT" 106 290 188 62 19 $C.Dark $true "Aptos" 2 | Out-Null
Add-Text $s "Frontend build" 380 157 230 24 17 $C.Green $true | Out-Null
Add-Text $s "82 module  ·  0.825 giây" 380 188 430 28 22 $C.White $true | Out-Null
Add-Line $s 380 232 890 232 $C.Card2 1 | Out-Null
$tests = @(
    @("01", "Trùng lịch xe và khách"),
    @("02", "Tiền giữ chỗ tối thiểu / 20%"),
    @("03", "Hash và xác minh mật khẩu"),
    @("04", "Ký và xác minh token")
)
$yy = 257
foreach ($test in $tests) {
    Add-Shape $s 1 380 $yy 510 48 $C.Card $null $true | Out-Null
    Add-Text $s $test[0] 398 ($yy + 12) 44 24 17 $C.Green $true | Out-Null
    Add-Text $s $test[1] 456 ($yy + 11) 340 25 18 $C.White $true | Out-Null
    Add-Pill $s "PASS" 810 ($yy + 12) 64
    $yy += 56
}
Add-Text $s "Điểm cần tối ưu: bundle frontend khoảng 522 kB" 70 455 630 26 17 $C.Muted $true | Out-Null
Add-Footer $s

# Slide 9
$s = New-Slide
Add-Title $s "ĐÁNH GIÁ" "Ưu điểm và hạn chế" 9
Add-Shape $s 1 50 146 410 330 $C.Card $null $true | Out-Null
Add-Text $s "ƯU ĐIỂM" 76 171 180 27 19 $C.Green $true | Out-Null
$pros = @("Bao phủ đầy đủ quy trình thuê xe", "Chống trùng lịch ở backend", "Có phân quyền, báo cáo và chat", "Giao diện trực quan, dễ sử dụng")
$yy = 222
foreach ($pro in $pros) {
    Add-Shape $s 9 76 ($yy + 1) 28 28 $C.Green | Out-Null
    Add-Text $s "✓" 82 ($yy + 5) 16 16 13 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $pro 122 $yy 300 42 18 $C.White $true | Out-Null
    $yy += 58
}
Add-Shape $s 1 500 146 412 330 $C.Bg2 $C.Amber $true | Out-Null
Add-Text $s "HẠN CHẾ" 526 171 180 27 19 $C.Amber $true | Out-Null
$cons = @("Thanh toán còn xác nhận thủ công", "Thiếu kiểm thử API/UI tự động", "Bundle frontend còn tương đối lớn", "Triển khai cloud chưa hoàn chỉnh")
$yy = 222
foreach ($con in $cons) {
    Add-Shape $s 9 526 ($yy + 1) 28 28 $C.Amber | Out-Null
    Add-Text $s "!" 534 ($yy + 5) 12 16 13 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $con 572 $yy 300 42 18 $C.White $true | Out-Null
    $yy += 58
}
Add-Footer $s

# Slide 10
$s = New-Slide
Add-Title $s "TƯƠNG LAI" "Lộ trình phát triển" 10
$roadmap = @(
    @("01", "THANH TOÁN", "Cổng thanh toán và webhook tự động", $C.Green),
    @("02", "KIỂM THỬ", "API test và E2E với Playwright", $C.Blue),
    @("03", "TRIỂN KHAI", "Docker · CI/CD · Cloud · Backup", $C.Amber),
    @("04", "THÔNG MINH", "Gợi ý xe và dự báo nhu cầu", $C.Green)
)
$xx = 50
foreach ($item in $roadmap) {
    Add-Shape $s 1 $xx 161 202 286 $C.Card $null $true | Out-Null
    Add-Text $s $item[0] ($xx + 20) 181 162 52 36 $item[3] $true | Out-Null
    Add-Line $s ($xx + 20) 246 ($xx + 182) 246 $C.Card2 2 | Out-Null
    Add-Text $s $item[1] ($xx + 20) 270 162 26 19 $C.White $true | Out-Null
    Add-Text $s $item[2] ($xx + 20) 315 162 86 18 $C.Muted $false | Out-Null
    $xx += 220
}
Add-Shape $s 1 184 470 592 34 $C.Green $null $true | Out-Null
Add-Text $s "Ưu tiên: Thanh toán tự động  ·  E2E test  ·  Docker" 204 477 552 20 17 $C.Dark $true "Aptos" 2 | Out-Null
Add-Footer $s

# Slide 11
$s = New-Slide
Add-Shape $s 9 410 82 140 140 $C.Green | Out-Null
if (Test-Path $logoImage) { $s.Shapes.AddPicture($logoImage, 0, -1, 438, 110, 84, 84) | Out-Null }
Add-Text $s "XIN CHÂN THÀNH CẢM ƠN" 100 270 760 52 38 $C.White $true "Aptos" 2 | Out-Null
Add-Text $s "Kính mong nhận được ý kiến đóng góp từ Thầy/Cô và Hội đồng" 130 340 700 32 19 $C.Muted $false "Aptos" 2 | Out-Null
Add-Shape $s 1 330 408 300 58 $C.Card $C.Green $true | Out-Null
Add-Text $s "Q & A" 330 422 300 28 23 $C.Green $true "Aptos" 2 | Out-Null

foreach ($slide in $presentation.Slides) {
    try { $slide.SlideShowTransition.EntryEffect = 3844 } catch { }
}
$presentation.SaveAs($output, 24)
$presentation.Close()
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($presentation) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
Write-Output $output
exit 0

# Slide 1
$s = New-Slide
$pic = $s.Shapes.AddPicture($homeImage, 0, -1, 0, 0, 960, 600)
$overlay = Add-Shape $s 1 0 0 960 540 $C.Bg
$overlay.Fill.Transparency = 0.18
$titlePanel = Add-Shape $s 1 36 78 660 186 $C.Bg
$titlePanel.Fill.Transparency = 0.08
Add-Pill $s "ĐỒ ÁN TỐT NGHIỆP" 52 42 150
Add-Text $s "XÂY DỰNG HỆ THỐNG`nQUẢN LÝ CHO THUÊ XE" 52 92 640 112 34 $C.White $true | Out-Null
Add-Text $s "Nền tảng số hóa toàn bộ quy trình từ tìm xe đến hoàn tất hợp đồng" 55 220 590 42 16 $C.Muted | Out-Null
Add-Shape $s 1 52 292 520 150 $C.Card $null $true | Out-Null
Add-Text $s "Giảng viên hướng dẫn" 74 315 190 20 11 $C.Muted $true | Out-Null
Add-Text $s "[Điền tên GVHD]" 277 313 260 23 15 $C.White $true | Out-Null
Add-Text $s "Sinh viên thực hiện" 74 356 190 20 11 $C.Muted $true | Out-Null
Add-Text $s "Phạm Công Minh  ·  [Cần xác nhận]" 277 354 270 23 15 $C.White $true | Out-Null
Add-Text $s "Lớp" 74 397 190 20 11 $C.Muted $true | Out-Null
Add-Text $s "[Điền tên lớp]" 277 395 260 23 15 $C.White $true | Out-Null
Add-Text $s "2026" 847 482 70 25 17 $C.Green $true "Aptos" 3 | Out-Null

# Slide 2
$s = New-Slide
Add-Title $s "BỐI CẢNH" "Lý do chọn đề tài & mục tiêu nghiên cứu" 2
Add-Text $s "01" 52 144 58 42 28 $C.Green $true | Out-Null
Add-Text $s "Bài toán thực tế" 112 148 240 30 20 $C.White $true | Out-Null
Add-Card $s 52 194 264 118 "Quản lý phân tán" "Thông tin xe, khách hàng, lịch thuê và thanh toán dễ rời rạc, khó đối soát." $C.Amber
Add-Card $s 52 326 264 118 "Rủi ro trùng lịch" "Xử lý thủ công có thể khiến cùng một xe hoặc cùng khách hàng bị xếp lịch chồng chéo." $C.Red
Add-Text $s "02" 369 144 58 42 28 $C.Green $true | Out-Null
Add-Text $s "Mục tiêu" 429 148 190 30 20 $C.White $true | Out-Null
$goals = @(
    @("Số hóa nghiệp vụ", "Xe → yêu cầu thuê → thanh toán → hợp đồng → trả xe"),
    @("Tự phục vụ 24/7", "Tìm, lọc, xem chi tiết và gửi yêu cầu thuê trực tuyến"),
    @("Quản trị tập trung", "Dashboard, phân quyền, báo cáo CSV/Excel"),
    @("Nâng cao trải nghiệm", "Chat hỗ trợ, AI Chat và theo dõi lịch sử thuê")
)
$gy = 194
foreach ($g in $goals) {
    Add-Shape $s 1 369 $gy 543 56 $C.Card $null $true | Out-Null
    Add-Shape $s 9 386 ($gy + 16) 24 24 $C.Green | Out-Null
    Add-Text $s "✓" 390 ($gy + 17) 16 15 11 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $g[0] 425 ($gy + 9) 180 19 13 $C.White $true | Out-Null
    Add-Text $s $g[1] 425 ($gy + 30) 460 18 10 $C.Muted | Out-Null
    $gy += 66
}
Add-Footer $s

# Slide 3
$s = New-Slide
Add-Title $s "CÔNG NGHỆ" "Kiến trúc và nền tảng sử dụng" 3
Add-Text $s "KIẾN TRÚC 3 LỚP" 52 140 210 18 10 $C.Green $true | Out-Null
$layers = @(
    @("01", "GIAO DIỆN", "React 19 · Vite 8`nReact Router · CSS responsive", $C.Green),
    @("02", "DỊCH VỤ", "FastAPI · REST API`nPydantic · Uvicorn", $C.Blue),
    @("03", "DỮ LIỆU", "SQLAlchemy ORM`nPostgreSQL", $C.Amber)
)
$lx = 52
foreach ($layer in $layers) {
    Add-Shape $s 1 $lx 175 244 144 $C.Card $null $true | Out-Null
    Add-Text $s $layer[0] ($lx + 18) 191 38 30 22 $layer[3] $true | Out-Null
    Add-Text $s $layer[1] ($lx + 61) 195 155 21 13 $C.White $true | Out-Null
    Add-Line $s ($lx + 18) 228 ($lx + 220) 228 $C.Card2 1 | Out-Null
    Add-Text $s $layer[2] ($lx + 18) 244 200 50 13 $C.Muted | Out-Null
    if ($lx -lt 500) { Add-Line $s ($lx + 246) 247 ($lx + 274) 247 $C.Green 2 $true | Out-Null }
    $lx += 296
}
Add-Text $s "THÀNH PHẦN BỔ TRỢ" 52 355 210 18 10 $C.Green $true | Out-Null
$extras = @(
    @("JWT + PBKDF2", "Xác thực, phân quyền admin/staff và bảo vệ mật khẩu"),
    @("OpenPyXL", "Xuất báo cáo doanh thu dưới dạng Excel và CSV"),
    @("Gemini / Groq / OpenRouter", "Tích hợp AI Chat theo cấu hình API key")
)
$ex = 52
foreach ($e in $extras) {
    Add-Shape $s 1 $ex 385 270 92 $C.Bg2 $C.Card2 $true | Out-Null
    Add-Text $s $e[0] ($ex + 16) 401 238 20 13 $C.White $true | Out-Null
    Add-Text $s $e[1] ($ex + 16) 428 238 35 10 $C.Muted | Out-Null
    $ex += 295
}
Add-Footer $s

# Slide 4
$s = New-Slide
Add-Title $s "PHÂN TÍCH" "Tác nhân và luồng nghiệp vụ chính" 4
$actors = @(
    @("KHÁCH HÀNG", "Tìm xe`nĐăng ký / đăng nhập`nGửi yêu cầu thuê`nThanh toán giữ chỗ`nTheo dõi lịch sử", $C.Green),
    @("NHÂN VIÊN", "Duyệt / từ chối yêu cầu`nXác nhận thanh toán`nTạo hợp đồng`nHỗ trợ khách hàng", $C.Blue),
    @("QUẢN TRỊ", "Quản lý xe & khách hàng`nQuản lý tài khoản`nTheo dõi dashboard`nXuất báo cáo", $C.Amber)
)
$ax = 52
foreach ($a in $actors) {
    Add-Shape $s 1 $ax 144 250 202 $C.Card $null $true | Out-Null
    Add-Shape $s 9 ($ax + 92) 161 66 66 $a[2] | Out-Null
    Add-Text $s $a[0] ($ax + 20) 239 210 23 15 $C.White $true "Aptos" 2 | Out-Null
    Add-Text $s $a[1] ($ax + 24) 274 202 60 11 $C.Muted $false "Aptos" 2 | Out-Null
    $ax += 303
}
Add-Text $s "LUỒNG XUYÊN SUỐT" 52 377 180 18 10 $C.Green $true | Out-Null
$steps = @("Chọn xe", "Kiểm tra lịch", "Giữ chỗ", "Duyệt yêu cầu", "Thanh toán", "Hợp đồng", "Trả xe")
$sx = 52
for ($i = 0; $i -lt $steps.Count; $i++) {
    $w = if ($i -eq 1 -or $i -eq 3) { 112 } else { 94 }
    Add-Shape $s 1 $sx 414 $w 48 $(if ($i -eq 1) { $C.Green } else { $C.Bg2 }) $(if ($i -eq 1) { $null } else { $C.Card2 }) $true | Out-Null
    Add-Text $s $steps[$i] ($sx + 6) 430 ($w - 12) 16 10 $(if ($i -eq 1) { $C.Dark } else { $C.White }) $true "Aptos" 2 | Out-Null
    if ($i -lt $steps.Count - 1) { Add-Line $s ($sx + $w + 3) 438 ($sx + $w + 18) 438 $C.Green 1.5 $true | Out-Null }
    $sx += $w + 25
}
Add-Footer $s

# Slide 5
$s = New-Slide
Add-Title $s "THIẾT KẾ" "Cấu trúc cơ sở dữ liệu quan hệ" 5
function Add-TableBox($slide, $x, $y, $w, $title, $fields, $accent) {
    $h = 36 + ($fields.Count * 18) + 12
    Add-Shape $slide 1 $x $y $w $h $C.Card $C.Card2 $true | Out-Null
    Add-Shape $slide 1 $x $y $w 32 $accent $null $true | Out-Null
    Add-Text $slide $title ($x + 12) ($y + 8) ($w - 24) 17 12 $C.Dark $true | Out-Null
    $fy = $y + 41
    foreach ($f in $fields) {
        Add-Text $slide $f ($x + 12) $fy ($w - 24) 14 9 $C.Muted | Out-Null
        $fy += 18
    }
}
Add-TableBox $s 50 143 160 "customers" @("PK customer_id", "name · phone · email", "password · address") $C.Green
Add-TableBox $s 50 333 160 "users" @("PK user_id", "email · password", "role: admin / staff") $C.Blue
Add-TableBox $s 275 143 160 "rental_requests" @("PK request_id", "FK customer_id", "FK car_id", "start_date · end_date", "status") $C.Amber
Add-TableBox $s 505 143 160 "cars" @("PK car_id", "license_plate", "price_per_day", "status · seats · fuel") $C.Green
Add-TableBox $s 505 340 160 "payments" @("PK payment_id", "FK request_id", "FK contract_id", "amount · type · status") $C.Blue
Add-TableBox $s 735 143 176 "contracts" @("PK contract_id", "FK request_id (unique)", "FK customer_id · car_id", "total_price · status") $C.Amber
Add-TableBox $s 735 354 176 "support_chat" @("conversation_id", "FK customer_id", "messages · sender", "read status") $C.Green
Add-Line $s 210 196 275 196 $C.Green 2 $true | Out-Null
Add-Line $s 435 196 505 196 $C.Green 2 $true | Out-Null
Add-Line $s 435 225 735 225 $C.Amber 2 $true | Out-Null
Add-Line $s 665 194 735 194 $C.Green 2 $true | Out-Null
Add-Line $s 585 268 585 340 $C.Blue 2 $true | Out-Null
Add-Line $s 823 270 823 340 $C.Blue 2 $true | Out-Null
Add-Line $s 130 262 130 320 $C.Green 2 | Out-Null
Add-Line $s 130 320 735 320 $C.Green 2 $true | Out-Null
Add-Text $s "Quan hệ trung tâm: Customer + Car → Rental Request → Payment → Contract" 275 486 540 18 11 $C.Muted $true "Aptos" 2 | Out-Null
Add-Footer $s

# Slide 6
$s = New-Slide
Add-Title $s "TRIỂN KHAI" "Giao diện người dùng và danh mục xe" 6
Add-Shape $s 1 48 140 420 284 $C.Card $null $true | Out-Null
$s.Shapes.AddPicture($homeImage, 0, -1, 60, 152, 396, 247) | Out-Null
Add-Pill $s "01 · TRANG CHỦ" 68 383 116
Add-Shape $s 1 492 140 420 284 $C.Card $null $true | Out-Null
$s.Shapes.AddPicture($carsImage, 0, -1, 504, 152, 396, 247) | Out-Null
Add-Pill $s "02 · TÌM & LỌC XE" 512 383 134
Add-Card $s 48 443 264 56 "Responsive" "Tối ưu trải nghiệm trên nhiều kích thước màn hình." $C.Green
Add-Card $s 328 443 282 56 "Bộ lọc đa tiêu chí" "Hãng xe, số chỗ, hộp số, mức giá và trạng thái." $C.Blue
Add-Card $s 626 443 286 56 "Thông tin trực quan" "Ảnh xe, giá/ngày, chi tiết và nút đặt xe nổi bật." $C.Amber
Add-Footer $s

# Slide 7
$s = New-Slide
Add-Title $s "THUẬT TOÁN" "Chống trùng lịch & tính tiền giữ chỗ" 7
Add-Shape $s 1 50 142 414 328 $C.Card $null $true | Out-Null
Add-Text $s "A · KIỂM TRA GIAO NHAU KHOẢNG NGÀY" 72 162 360 22 12 $C.Green $true | Out-Null
Add-Text $s "Có trùng lịch khi:" 72 202 150 20 12 $C.Muted | Out-Null
Add-Shape $s 1 72 232 366 58 $C.Bg2 $C.Card2 $true | Out-Null
Add-Text $s "start_existing ≤ end_new`nAND  end_existing ≥ start_new" 90 244 330 38 16 $C.White $true "Consolas" 2 | Out-Null
$flow = @("Kiểm tra ngày", "Kiểm tra trạng thái xe", "Kiểm tra lịch của xe", "Kiểm tra lịch của khách", "Tạo yêu cầu")
$fy = 314
foreach ($f in $flow) {
    Add-Shape $s 1 90 $fy 320 27 $(if ($f -eq "Tạo yêu cầu") { $C.Green } else { $C.Bg2 }) $(if ($f -eq "Tạo yêu cầu") { $null } else { $C.Card2 }) $true | Out-Null
    Add-Text $s $f 100 ($fy + 7) 300 13 9 $(if ($f -eq "Tạo yêu cầu") { $C.Dark } else { $C.White }) $true "Aptos" 2 | Out-Null
    $fy += 31
}
Add-Shape $s 1 490 142 422 328 $C.Card $null $true | Out-Null
Add-Text $s "B · CÔNG THỨC THANH TOÁN" 512 162 360 22 12 $C.Green $true | Out-Null
$formulas = @(
    @("Số ngày", "end_date − start_date + 1"),
    @("Phí thuê", "số ngày × giá thuê/ngày"),
    @("Tổng tiền", "phí thuê + VAT 8%"),
    @("Giữ chỗ", "max(20% tổng tiền, 300.000đ)"),
    @("Còn lại", "tổng tiền − tiền giữ chỗ")
)
$yy = 205
foreach ($f in $formulas) {
    Add-Text $s $f[0] 512 $yy 92 17 11 $C.Muted $true | Out-Null
    Add-Shape $s 1 610 ($yy - 5) 274 30 $C.Bg2 $C.Card2 $true | Out-Null
    Add-Text $s $f[1] 622 ($yy + 3) 250 15 11 $C.White $true | Out-Null
    $yy += 46
}
Add-Text $s "Kết quả: giảm rủi ro double-booking và chuẩn hóa số tiền ở cả frontend lẫn backend." 512 435 360 28 10 $C.Green $true | Out-Null
Add-Footer $s

# Slide 8
$s = New-Slide
Add-Title $s "KẾT QUẢ" "Kiểm thử kỹ thuật và mức độ hoàn thiện" 8
$metrics = @(
    @("82", "module React được build", $C.Green),
    @("0.825s", "thời gian Vite build", $C.Blue),
    @("7/7", "kiểm thử logic đạt", $C.Amber),
    @("0", "lỗi biên dịch Python", $C.Green)
)
$mx = 50
foreach ($m in $metrics) {
    Add-Shape $s 1 $mx 142 202 105 $C.Card $null $true | Out-Null
    Add-Text $s $m[0] ($mx + 14) 160 174 38 27 $m[2] $true "Aptos" 2 | Out-Null
    Add-Text $s $m[1] ($mx + 14) 207 174 20 10 $C.Muted $true "Aptos" 2 | Out-Null
    $mx += 220
}
Add-Text $s "MA TRẬN KIỂM THỬ LOGIC" 50 279 250 18 10 $C.Green $true | Out-Null
$tests = @(
    @("Trùng lịch xe", "Phát hiện giao nhau tại ngày biên", "PASS"),
    @("Lịch xe hợp lệ", "Khoảng ngày không giao nhau", "PASS"),
    @("Trùng lịch khách", "Một khách thuê 2 xe cùng lúc", "PASS"),
    @("Tiền giữ chỗ", "Tối thiểu 300.000đ / đúng 20%", "PASS"),
    @("Bảo mật", "PBKDF2 hash + verify mật khẩu", "PASS"),
    @("Token", "Ký và xác minh token truy cập", "PASS")
)
$ty = 309
foreach ($t in $tests) {
    Add-Shape $s 1 50 $ty 862 29 $(if (($ty / 29) % 2 -gt 1) { $C.Bg2 } else { $C.Card }) | Out-Null
    Add-Text $s $t[0] 66 ($ty + 7) 180 14 10 $C.White $true | Out-Null
    Add-Text $s $t[1] 260 ($ty + 7) 510 14 10 $C.Muted | Out-Null
    Add-Pill $s $t[2] 822 ($ty + 3) 70 $C.Green $C.Dark
    $ty += 32
}
Add-Text $s "Lưu ý: Vite cảnh báo bundle JS ~522 kB; đây là đầu mối tối ưu ở giai đoạn tiếp theo." 50 505 700 15 9 $C.Muted | Out-Null
Add-Footer $s

# Slide 9
$s = New-Slide
Add-Title $s "ĐÁNH GIÁ" "Ưu điểm và hạn chế của hệ thống" 9
Add-Text $s "ƯU ĐIỂM" 52 144 180 22 12 $C.Green $true | Out-Null
$pros = @(
    "Bao phủ quy trình nghiệp vụ tương đối đầy đủ",
    "Kiểm soát trùng lịch xe và trùng lịch khách",
    "Phân quyền JWT; mật khẩu PBKDF2-SHA256",
    "Dashboard doanh thu, tỷ lệ sử dụng, xuất báo cáo",
    "Giao diện hiện đại; có chat hỗ trợ và AI Chat"
)
$py = 180
foreach ($p in $pros) {
    Add-Shape $s 9 56 ($py + 2) 22 22 $C.Green | Out-Null
    Add-Text $s "✓" 60 ($py + 5) 14 13 10 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $p 90 $py 365 29 12 $C.White $true | Out-Null
    $py += 55
}
Add-Text $s "HẠN CHẾ" 510 144 180 22 12 $C.Amber $true | Out-Null
$cons = @(
    "Thanh toán QR mới dừng ở bước xác nhận thủ công",
    "Chưa có kiểm thử API/UI tự động đầy đủ",
    "Bundle frontend còn lớn, cần code splitting",
    "Cấu hình triển khai chủ yếu phục vụ local/tunnel",
    "AI Chat phụ thuộc API key và dịch vụ bên thứ ba"
)
$cy = 180
foreach ($con in $cons) {
    Add-Shape $s 9 514 ($cy + 2) 22 22 $C.Amber | Out-Null
    Add-Text $s "!" 520 ($cy + 5) 10 13 10 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Text $s $con 548 $cy 355 29 12 $C.White $true | Out-Null
    $cy += 55
}
Add-Shape $s 1 52 475 850 34 $C.Bg2 $C.Card2 $true | Out-Null
Add-Text $s "Đánh giá chung: hệ thống đáp ứng tốt phạm vi đồ án và có nền tảng rõ ràng để triển khai thực tế." 72 486 810 15 11 $C.Green $true "Aptos" 2 | Out-Null
Add-Footer $s

# Slide 10
$s = New-Slide
Add-Title $s "TƯƠNG LAI" "Hướng phát triển theo lộ trình" 10
Add-Line $s 110 286 850 286 $C.Card2 5 | Out-Null
$roadmap = @(
    @("01", "Thanh toán", "Tích hợp cổng thanh toán và webhook đối soát tự động", $C.Green),
    @("02", "Chất lượng", "Pytest, API integration test, E2E với Playwright", $C.Blue),
    @("03", "Triển khai", "Docker, CI/CD, cloud database, giám sát và backup", $C.Amber),
    @("04", "Thông minh", "Gợi ý xe, dự báo nhu cầu và giá thuê linh hoạt", $C.Green)
)
$rx = 54
for ($i = 0; $i -lt $roadmap.Count; $i++) {
    $r = $roadmap[$i]
    $above = ($i % 2 -eq 0)
    $cardY = if ($above) { 145 } else { 327 }
    Add-Shape $s 9 ($rx + 75) 270 32 32 $r[3] | Out-Null
    Add-Text $s $r[0] ($rx + 82) 278 18 14 9 $C.Dark $true "Aptos" 2 | Out-Null
    Add-Line $s ($rx + 91) $(if ($above) { 253 } else { 302 }) ($rx + 91) $(if ($above) { 270 } else { 327 }) $r[3] 2 | Out-Null
    Add-Shape $s 1 $rx $cardY 182 108 $C.Card $null $true | Out-Null
    Add-Text $s $r[1] ($rx + 16) ($cardY + 15) 150 21 14 $C.White $true | Out-Null
    Add-Text $s $r[2] ($rx + 16) ($cardY + 44) 150 51 10 $C.Muted | Out-Null
    $rx += 220
}
Add-Text $s "Ưu tiên ngắn hạn" 54 482 130 16 10 $C.Green $true | Out-Null
Add-Text $s "Thanh toán tự động + kiểm thử E2E + đóng gói Docker" 190 482 500 16 11 $C.White $true | Out-Null
Add-Footer $s

# Slide 11
$s = New-Slide
Add-Shape $s 9 410 88 140 140 $C.Green | Out-Null
if (Test-Path $logoImage) { $s.Shapes.AddPicture($logoImage, 0, -1, 438, 116, 84, 84) | Out-Null }
Add-Text $s "XIN CHÂN THÀNH CẢM ƠN" 120 266 720 52 30 $C.White $true "Aptos" 2 | Out-Null
Add-Text $s "Kính mong nhận được ý kiến đóng góp từ Thầy/Cô và Hội đồng" 160 330 640 28 15 $C.Muted $false "Aptos" 2 | Out-Null
Add-Shape $s 1 315 393 330 54 $C.Card $C.Card2 $true | Out-Null
Add-Text $s "Q & A" 315 407 330 25 18 $C.Green $true "Aptos" 2 | Out-Null
Add-Text $s "CAR RENTAL MANAGEMENT SYSTEM · 2026" 295 496 370 15 9 $C.Muted $true "Aptos" 2 | Out-Null

# Set slide transitions and save.
foreach ($slide in $presentation.Slides) {
    try { $slide.SlideShowTransition.EntryEffect = 3844 } catch { }
}
$presentation.SaveAs($output, 24)
$presentation.Close()
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($presentation) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
Write-Output $output
