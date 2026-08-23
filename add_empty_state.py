with open("frontend/css/style.css", "a", encoding="utf-8") as f:
    f.write("""

/* --- Empty States --- */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    background: var(--bg-card);
    border: 1px dashed var(--border-card);
    border-radius: var(--radius-lg);
    margin: 2rem 0;
    color: var(--text-secondary);
    animation: fadeIn 0.4s ease-out;
}

.empty-icon {
    font-size: 3rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
    background: var(--bg-surface);
    height: 80px;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    opacity: 0.8;
}

.empty-icon svg {
    width: 40px;
    height: 40px;
    stroke: var(--text-muted);
}

.empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.empty-state p {
    font-size: 0.95rem;
    max-width: 400px;
    line-height: 1.5;
}
""")
