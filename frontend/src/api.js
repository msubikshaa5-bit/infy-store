export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  let res;

  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) throw new Error(data?.message || 'Something went wrong');
  return data;
}

// File upload needs multipart data, so it can't use api() above (that one sends JSON)
export async function uploadImage(file) {
  const token = localStorage.getItem('token');
  const body = new FormData();
  body.append('image', file);

  let res;
  try {
    res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }
  if (!res.ok) throw new Error(data?.message || 'Upload failed');
  return data.url;
}