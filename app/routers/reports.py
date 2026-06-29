from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime
from fastapi.responses import StreamingResponse
import csv
import io
from openpyxl import Workbook

from app.dependencies import get_db, require_staff_or_admin
from app.models.payment import Payment
from app.models.contract import Contract
from app.models.rental_request import RentalRequest
from app.models.car import Car
from app.schemas.report import DashboardStats, MonthlyRevenue

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary", response_model=DashboardStats)
def summary(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    payments = db.query(Payment).filter(Payment.status == "paid").all()
    cars = db.query(Car).all()

    total_revenue = float(sum(payment.amount for payment in payments))
    total_contracts = len({payment.contract_id for payment in payments if payment.contract_id})
    total_cars = len(cars)
    cars_rented = sum(1 for car in cars if car.status == "rented")
    usage_rate = float(cars_rented) / total_cars if total_cars else 0.0

    monthly = defaultdict(float)
    for payment in payments:
        contract = db.query(Contract).filter(Contract.contract_id == payment.contract_id).first() if payment.contract_id else None
        if contract and contract.start_date:
            month_key = contract.start_date.strftime("%Y-%m")
        elif payment.request_id:
            rental_request = db.query(RentalRequest).filter(RentalRequest.request_id == payment.request_id).first()
            month_key = rental_request.start_date.strftime("%Y-%m") if rental_request and rental_request.start_date else datetime.now().strftime("%Y-%m")
        else:
            month_key = datetime.now().strftime("%Y-%m")
        monthly[month_key] += float(payment.amount)

    monthly_revenue = [MonthlyRevenue(month=month, revenue=revenue) for month, revenue in sorted(monthly.items())]

    return DashboardStats(
        total_revenue=total_revenue,
        total_contracts=total_contracts,
        total_cars=total_cars,
        cars_rented=cars_rented,
        usage_rate=usage_rate,
        monthly_revenue=monthly_revenue,
    )

@router.get("/export-csv")
def export_csv(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    payments = db.query(Payment).filter(Payment.status == "paid").all()
    headers = ["payment_id", "contract_id", "request_id", "payment_type", "amount", "total_amount", "remaining_amount", "status"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for payment in payments:
        writer.writerow([
            payment.payment_id,
            payment.contract_id,
            payment.request_id,
            payment.payment_type,
            float(payment.amount or 0),
            float(payment.total_amount or 0),
            float(payment.remaining_amount or 0),
            payment.status,
        ])

    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=payments_report.csv"
    return response

@router.get("/export-excel")
def export_excel(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    payments = db.query(Payment).filter(Payment.status == "paid").all()
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Payments"
    headers = ["payment_id", "contract_id", "request_id", "payment_type", "amount", "total_amount", "remaining_amount", "status"]
    sheet.append(headers)

    for payment in payments:
        sheet.append([
            payment.payment_id,
            payment.contract_id,
            payment.request_id,
            payment.payment_type,
            float(payment.amount or 0),
            float(payment.total_amount or 0),
            float(payment.remaining_amount or 0),
            payment.status,
        ])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    response = StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response.headers["Content-Disposition"] = "attachment; filename=payments_report.xlsx"
    return response
