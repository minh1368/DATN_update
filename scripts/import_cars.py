#!/usr/bin/env python3
"""
Script để import dữ liệu xe từ carData.js vào database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.car import Car

# Dữ liệu xe từ carData.js (đã chuyển đổi từ JavaScript)
cars_data = [
    {
        "name": "VinFast VF 9",
        "brand": "VinFast", 
        "license_plate": "30A-12345",
        "price_per_day": 1800000,
        "status": "available",
        "color": "Green",
        "seats": 7,
        "fuel_type": "E-SUV",
        "transmission": "Tự động",
        "year": 2025,
        "description": "Xe SUV cao cấp, hành trình dài, phù hợp gia đình và du lịch."
    },
    {
        "name": "VinFast VF 3",
        "brand": "VinFast",
        "license_plate": "30A-23456", 
        "price_per_day": 850000,
        "status": "available",
        "color": "Yellow",
        "seats": 4,
        "fuel_type": "Minicar",
        "transmission": "Tự động",
        "year": 2025,
        "description": "Xe đô thị nhỏ gọn, linh hoạt, dễ lái trong phố."
    },
    {
        "name": "VinFast VF 6",
        "brand": "VinFast",
        "license_plate": "30A-34567",
        "price_per_day": 1250000,
        "status": "available", 
        "color": "Blue",
        "seats": 5,
        "fuel_type": "B-SUV",
        "transmission": "Tự động",
        "year": 2025,
        "description": "Xe SUV cỡ nhỏ, cân bằng giữa phong cách và tiện nghi."
    },
    {
        "name": "VinFast VF 5",
        "brand": "VinFast",
        "license_plate": "30A-45678",
        "price_per_day": 980000,
        "status": "available",
        "color": "White",
        "seats": 5,
        "fuel_type": "Electric",
        "transmission": "Tự động",
        "year": 2025,
        "description": "Gọn gàng, tiết kiệm, phù hợp di chuyển nội đô và đi gần."
    },
    {
        "name": "VinFast Lux A2.0",
        "brand": "VinFast",
        "license_plate": "30A-56789",
        "price_per_day": 1400000,
        "status": "available",
        "color": "Black",
        "seats": 5,
        "fuel_type": "Sedan",
        "transmission": "Tự động",
        "year": 2024,
        "description": "Sedan sang trọng, phù hợp chạy đường dài và gia đình."
    },
    {
        "name": "VinFast Lux SA2.0",
        "brand": "VinFast",
        "license_plate": "30A-67890",
        "price_per_day": 1600000,
        "status": "available",
        "color": "Silver",
        "seats": 7,
        "fuel_type": "SUV",
        "transmission": "Tự động",
        "year": 2024,
        "description": "SUV 7 chỗ rộng rãi, phù hợp đi nhóm và gia đình."
    },
    {
        "name": "Tesla Model 3",
        "brand": "Tesla",
        "license_plate": "30A-78901",
        "price_per_day": 2200000,
        "status": "available",
        "color": "Red",
        "seats": 5,
        "fuel_type": "Electric",
        "transmission": "Tự động",
        "year": 2025,
        "description": "Xe điện hiệu suất cao, trải nghiệm công nghệ hiện đại."
    },
    {
        "name": "Tesla Model Y",
        "brand": "Tesla",
        "license_plate": "30A-89012",
        "price_per_day": 2500000,
        "status": "available",
        "color": "Gray",
        "seats": 5,
        "fuel_type": "Electric",
        "transmission": "Tự động",
        "year": 2025,
        "description": "Cốp rộng, gầm cao, phù hợp gia đình và du lịch."
    },
    {
        "name": "Toyota Innova",
        "brand": "Toyota",
        "license_plate": "30A-90123",
        "price_per_day": 950000,
        "status": "available",
        "color": "Silver",
        "seats": 7,
        "fuel_type": "Hybrid",
        "transmission": "Tự động",
        "year": 2024,
        "description": "Xe gia đình đa dụng, thoải mái cho hành trình dài."
    },
    {
        "name": "Toyota Vios",
        "brand": "Toyota",
        "license_plate": "30A-01234",
        "price_per_day": 650000,
        "status": "available",
        "color": "White",
        "seats": 5,
        "fuel_type": "Sedan",
        "transmission": "Tự động",
        "year": 2023,
        "description": "Sedan phổ thông, bền bỉ, chi phí vận hành hợp lý."
    },
    {
        "name": "Mazda CX-5",
        "brand": "Mazda",
        "license_plate": "30A-12346",
        "price_per_day": 1100000,
        "status": "available",
        "color": "Gray",
        "seats": 5,
        "fuel_type": "SUV",
        "transmission": "Tự động",
        "year": 2024,
        "description": "SUV thể thao, cân bằng giữa tiện nghi và vận hành."
    },
    {
        "name": "Mazda 3",
        "brand": "Mazda",
        "license_plate": "30A-23457",
        "price_per_day": 820000,
        "status": "available",
        "color": "Blue",
        "seats": 5,
        "fuel_type": "Sedan",
        "transmission": "Tự động",
        "year": 2024,
        "description": "Thiết kế đẹp, lái đầm, phù hợp đi làm và đi chơi."
    },
    {
        "name": "Kia Seltos",
        "brand": "Kia",
        "license_plate": "30A-34568",
        "price_per_day": 900000,
        "status": "available",
        "color": "Orange",
        "seats": 5,
        "fuel_type": "SUV",
        "transmission": "Tự động",
        "year": 2024,
        "description": "SUV đô thị, gọn nhưng rộng rãi, nhiều tiện ích."
    },
    {
        "name": "Hyundai Accent",
        "brand": "Hyundai",
        "license_plate": "30A-45679",
        "price_per_day": 620000,
        "status": "available",
        "color": "White",
        "seats": 5,
        "fuel_type": "Sedan",
        "transmission": "Tự động",
        "year": 2023,
        "description": "Sedan tiết kiệm nhiên liệu, phù hợp mọi nhu cầu di chuyển."
    },
    {
        "name": "Hyundai SantaFe",
        "brand": "Hyundai",
        "license_plate": "30A-56780",
        "price_per_day": 1350000,
        "status": "available",
        "color": "Black",
        "seats": 7,
        "fuel_type": "SUV",
        "transmission": "Tự động",
        "year": 2024,
        "description": "7 chỗ rộng rãi, phù hợp gia đình, đi tỉnh, du lịch."
    }
]

def import_cars():
    """Import dữ liệu xe vào database"""
    # Tạo bảng nếu chưa có
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Kiểm tra xe đã tồn tại
        existing_plates = {car.license_plate for car in db.query(Car).all()}
        
        imported_count = 0
        skipped_count = 0
        
        for car_data in cars_data:
            if car_data["license_plate"] in existing_plates:
                print(f"Skipped {car_data['name']} - plate {car_data['license_plate']} already exists")
                skipped_count += 1
                continue
            
            # Tạo xe mới
            new_car = Car(**car_data)
            db.add(new_car)
            db.commit()
            db.refresh(new_car)
            
            print(f"Imported {new_car.name} (ID: {new_car.car_id})")
            imported_count += 1
        
        print("\nResult:")
        print(f"   - Imported: {imported_count} cars")
        print(f"   - Skipped: {skipped_count} cars")
        print(f"   - Total: {len(cars_data)} cars")
        
    except Exception as e:
        print(f"Car import failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting car import...")
    import_cars()
    print("Completed.")
