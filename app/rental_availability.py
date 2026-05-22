from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.rental_request import RentalRequest


ACTIVE_REQUEST_STATUSES = ("pending", "approved")
ACTIVE_CONTRACT_STATUSES = ("pending", "approved")


def has_overlapping_booking(
    db: Session,
    car_id: int,
    start_date,
    end_date,
    exclude_request_id: int | None = None,
    exclude_contract_id: int | None = None,
) -> bool:
    request_query = db.query(RentalRequest).filter(
        RentalRequest.car_id == car_id,
        RentalRequest.status.in_(ACTIVE_REQUEST_STATUSES),
        RentalRequest.start_date < end_date,
        RentalRequest.end_date > start_date,
    )
    if exclude_request_id is not None:
        request_query = request_query.filter(RentalRequest.request_id != exclude_request_id)
    if request_query.first():
        return True

    contract_query = db.query(Contract).filter(
        Contract.car_id == car_id,
        Contract.status.in_(ACTIVE_CONTRACT_STATUSES),
        Contract.start_date < end_date,
        Contract.end_date > start_date,
    )
    if exclude_contract_id is not None:
        contract_query = contract_query.filter(Contract.contract_id != exclude_contract_id)
    return contract_query.first() is not None
