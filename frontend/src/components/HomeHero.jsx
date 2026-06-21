export default function HomeHero({ selectedRentalType, navigate }) {
  const isSelfDrive = selectedRentalType === "tự lái";

  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Đáp ứng mọi nhu cầu thuê xe</h1>
        <p className="hero-subtitle">
          Cung cấp dịch vụ thuê xe {isSelfDrive ? "tự lái" : "có lái"}, phục vụ mọi nhu cầu di chuyển của bạn
        </p>
        <button
          className="cta-button hero-rental-button"
          type="button"
          onClick={() => navigate("/thue-xe-tu-lai")}
        >
          Thuê xe tự lái
        </button>
      </div>
    </section>
  );
}
