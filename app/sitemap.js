export default function sitemap() {
  const baseUrl = 'https://smart-warehouse-system-three.vercel.app';
  const routes = ['', '/dashboard', '/orders', '/inventory', '/fulfillment', '/analytics'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'hourly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
