import { Link, useParams } from "react-router-dom";
import AppFooter from "../components/AppFooter.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { getNewsBySlug, formatNewsDate, newsArticles } from "../lib/newsData.js";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const article = getNewsBySlug(slug);

  if (!article) {
    return (
      <div className="gf-page news-page">
        <PageHeader />
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
      <PageHeader />

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
