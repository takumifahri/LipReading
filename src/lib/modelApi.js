const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getPredictApiUrl() {
  if (!API_BASE_URL) {
    return null;
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/predict`;
}

export const PREDICT_API_URL = getPredictApiUrl();

export async function predictFromApi(landmarks) {
  if (!PREDICT_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(PREDICT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ landmarks }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Prediction request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data?.detail || 'Prediction failed');
  }

  return {
    ...data,
    timestamp: Date.now(),
  };
}

export async function predictStub(landmarks) {
  return predictFromApi(landmarks);
}

const modelApi = { predictFromApi, predictStub, PREDICT_API_URL };

export default modelApi;
