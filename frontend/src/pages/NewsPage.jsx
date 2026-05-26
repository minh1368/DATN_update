import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import AppFooter from "../components/AppFooter.jsx";
import { NEWS_CATEGORIES, newsArticles, formatNewsDate } from "../lib/newsData.js";

const PAGE_SIZE = 6;

export default function NewsPage() {
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list =
      category === "all" ? newsArticles : newsArticles.filter((a) => a.category === category);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [category]);

  const featured = useMemo(
    () => newsArticles.filter((a) => a.featured).slice(0, 3),
    []
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategory = (id) => {
    setCategory(id);
    setPage(1);
  };

  return (
    <div className="gf-page news-page">
      <header className="gf-header">
        <div className="gf-header-inner">
          <Link to="/" className="gf-brand">
            <span className="logo-icon"><img src="/image/brand/logo.png" alt="Phương Đông" /></span>
            <span className="gf-brand-text">Phương Đông</span>
          </Link>
          <nav className="gf-nav">
            <Link to="/" className="gf-nav-link">
              Trang chủ
            </Link>
            <span className="gf-nav-sep">/</span>
            <span className="gf-nav-current">Tin tức</span>
          </nav>
          <div className="gf-header-cta">
            <a className="login-btn" href="tel:0566999666">
              Hotline: 0566 999 666
            </a>
          </div>
        </div>
      </header>

      <section className="news-banner">
        <div className="news-banner-overlay" />
        <div className="news-banner-inner">
          <h1>Tin tức</h1>
          <p>Cập nhật kiến thức về xe, thuê xe và ưu đãi từ Phương Đông</p>
        </div>
      </section>

      <div className="news-body">
        <aside className="news-sidebar">
          <nav className="news-tabs" aria-label="Lọc tin tức">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`news-tab ${category === cat.id ? "active" : ""}`}
                onClick={() => handleCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </nav>
          <Link to="/thue-xe-tu-lai" className="news-promo-card">
            <span className="news-promo-label">Đặt xe ngay</span>
            <strong>Thuê xe tự lái &amp; có lái</strong>
            <span className="news-promo-link">Xem danh sách xe →</span>
          </Link>
        </aside>

        <main className="news-main">
          <section className="news-featured">
            <h2>Tin tức nổi bật</h2>
            <div className="news-featured-grid">
              {featured.map((article) => (
                <Link key={article.slug} to={`/tin-tuc/${article.slug}`} className="news-featured-card">
                  <div className="news-featured-media">
                    <img src={article.image} alt="" loading="lazy" />
                  </div>
                  <div className="news-featured-body">
                    <h3>{article.title}</h3>
                    <time dateTime={article.date}>{formatNewsDate(article.date)}</time>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="news-list-section">
            <div className="news-list-grid">
              {paginated.map((article) => (
                <Link key={article.slug} to={`/tin-tuc/${article.slug}`} className="news-card">
                  <div className="news-card-media">
                    <img src={article.image} alt="" loading="lazy" />
                    {article.category === "promo" ? (
                      <span className="news-card-badge">Ưu đãi</span>
                    ) : (
                      <span className="news-card-badge news-card-badge-blog">Blog</span>
                    )}
                  </div>
                  <div className="news-card-body">
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                    <time dateTime={article.date}>{formatNewsDate(article.date)}</time>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="news-empty">Chưa có bài viết trong mục này.</p>
            ) : null}

            {totalPages > 1 ? (
              <nav className="news-pagination" aria-label="Phân trang">
                <button
                  type="button"
                  className="news-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`news-page-btn ${currentPage === n ? "active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="news-page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau
                </button>
              </nav>
            ) : null}
          </section>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
