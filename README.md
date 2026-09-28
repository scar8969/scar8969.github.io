# Priyanshu Rout — Personal Site

A static, framework-free personal portfolio and engineering site. Robotics,
embedded systems, quant trading, and open tools.

## Run locally

```bash
python -m http.server 8080
```

then open http://localhost:8080

## Structure

```
public/
  index.html          homepage (hero + selected work)
  projects.html       full project index
  tools.html          interactive tools (gear solver)
  about.html          about + contact
  css/style.css       design system
  js/                 vanilla JS (no framework)
```

## Stack

- Plain HTML + CSS + vanilla JS — no build step, no framework
- Serves as static files from any host (GitHub Pages, Netlify, Vercel, Railway)

## License

MIT
