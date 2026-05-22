import { Link, useParams } from "react-router-dom";
import "../App.css";
import AppFooter from "../components/AppFooter.jsx";
import { getNewsBySlug, formatNewsDate, newsArticles } from "../lib/newsData.js";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const article = getNewsBySlug(slug);

  if (!article) {
    return (
      <div className="gf-page news-page">
        <header className="gf-header">
          <div className="gf-header-inner">
            <Link to="/" className="gf-brand">
              <span className="logo-icon">PDC</span>
              <span className="gf-brand-text">Phương Đông</span>
            </Link>
          </div>
        </header>
        <main className="news-detail-empty">
          <h1>Không tìm thấy bài viết</h1>
          <Link to="/tin-tuc" className="cta-button">
            Quay lại tin tức
          </Link>
        </main>
      </div>
    );
  }

  const related = newsArticles
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 3);

  return (
    <div className="gf-page news-page">
      <header className="gf-header">
        <div className="gf-header-inner">
          <Link to="/" className="gf-brand">
            <span className="logo-icon">PDC</span>
            <span className="gf-brand-text">Phương Đông</span>
          </Link>
          <nav className="gf-nav">
            <Link to="/tin-tuc" className="gf-nav-link">
              Tin tức
            </Link>
            <span className="gf-nav-sep">/</span>
            <span className="gf-nav-current">Chi tiết</span>
          </nav>
          <div className="gf-header-cta">
            <a className="login-btn" href="tel:0566999666">
              Hotline: 0566 999 666
            </a>
          </div>
        </div>
      </header>

      <article className="news-detail">
        <div className="news-detail-topbar">
          <Link to="/tin-tuc" className="news-back">
            ← Quay lại tin tức
          </Link>
        </div>
        <div className="news-detail-hero">
          <img src={article.image} alt="" />
        </div>
        <div className="news-detail-inner">
          <span className={`news-detail-tag ${article.category === "promo" ? "promo" : "blog"}`}>
            {article.category === "promo" ? "Ưu đãi" : "Blog"}
          </span>
          <h1>{article.title}</h1>
          <time dateTime={article.date}>{formatNewsDate(article.date)}</time>
          <p className="news-detail-lead">{article.excerpt}</p>
          <div className="news-detail-content">
            {article.content.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          {related.length > 0 ? (
            <section className="news-related">
              <h2>Tin liên quan</h2>
              <div className="news-related-grid">
                {related.map((item) => (
                  <Link key={item.slug} to={`/tin-tuc/${item.slug}`} className="news-related-card">
                    <img src={item.image} alt="" loading="lazy" />
                    <h3>{item.title}</h3>
                    <time dateTime={item.date}>{formatNewsDate(item.date)}</time>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>

      <AppFooter />
    </div>
  );
}
