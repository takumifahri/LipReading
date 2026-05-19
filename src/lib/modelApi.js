export const PREDICT_API_URL = 'https://lipreading.takumifahri.my.id/predict';

export async function predictFromApi(landmarks) {
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

export default { predictFromApi, predictStub, PREDICT_API_URL };
