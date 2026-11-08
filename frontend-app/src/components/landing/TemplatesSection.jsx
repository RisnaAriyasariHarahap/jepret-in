import { useState } from 'react'
import TemplatePreview from './TemplatePreview.jsx'

export default function TemplatesSection({
  templates,
  selectedIndex,
  onSelect,
  activeTemplate,
  onStart,
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const categories = ['Semua', ...new Set(templates.map((template) => template.category))]

  const visibleTemplates = templates
    .map((template, index) => ({ ...template, index }))
    .filter(
      (template) =>
        selectedCategory === 'Semua' ||
        template.category === selectedCategory
    )

  return (
    <section className="templates-section" id="templates">
      <div className="template-heading">
        <div>
          <span className="section-label">FIND YOUR FAVORITE</span>
          <h2>Jelajahi <span>Template</span></h2>
          <p>Pilih template favoritmu dan mulai abadikan momenmu!</p>
        </div>

        <div className="template-decoration">♡ ✧ ♡</div>
      </div>

      <div className="template-categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-chip ${
              selectedCategory === category ? 'active' : ''
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="template-grid">
        {visibleTemplates.map((template) => (
          <button
            type="button"
            key={template.className}
            className={`template-card ${template.className} ${
              selectedIndex === template.index ? 'selected' : ''
            }`}
            onClick={() => onSelect(template.index)}
          >
            <div
              className="template-art"
              style={template.config ? { background: template.background } : undefined}
            >
              <span className="template-tag">{template.tag}</span>

              {template.isPremium && (
                <span className="template-premium-badge">
                  {template.locked ? '🔒' : '👑'} PREMIUM
                </span>
              )}

              {template.config ? (
                <TemplatePreview template={template} />
              ) : (
                <div className="mini-strip">
                  <div>♡</div>
                  <div>✿</div>
                  <div>✧</div>
                  <div className="mini-strip-label">JEPRET.IN</div>
                </div>
              )}

              <span className="art-sparkle">✧</span>
            </div>

            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>

              <span className="template-select">
                {selectedIndex === template.index
                  ? '✓ Template dipilih'
                  : 'Pilih template ♡'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="template-cta">
        <div className="template-cta-copy">
          <div className="selected-indicator">♡</div>
          <div>
            <strong>{activeTemplate.name}</strong>
            <p>
              {activeTemplate.locked
                ? 'Template ini khusus pengguna Premium.'
                : 'Template pilihanmu siap digunakan.'}
            </p>
          </div>
        </div>

        <button className="primary-button" onClick={onStart}>
          {activeTemplate.locked ? '🔒 Buka dengan Premium' : 'Mulai Foto →'}
        </button>
      </div>
    </section>
  )
}