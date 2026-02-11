/**
 * Mock API service — simulates backend calls with realistic delays.
 * Swap for real API client once backend integration is ready.
 */

// Two sample pairs: original photo + anime result (free-licence images from picsum)
const MOCK_PAIRS = [
  {
    original:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop",
    generated:
      "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=600&h=800&fit=crop",
  },
  {
    original:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop",
    generated:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=800&fit=crop",
  },
];

function randomId(): string {
  return crypto.randomUUID();
}

/**
 * Simulate submitting a job. Returns fake URLs after a 3–5 s delay.
 */
export async function submitGenerationJob(
  _image: File | null,
  _prompt: string
): Promise<{
  jobId: string;
  originalImageUrl: string;
  generatedImageUrl: string;
}> {
  const delay = 3000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, delay));

  const pair = MOCK_PAIRS[Math.floor(Math.random() * MOCK_PAIRS.length)];

  return {
    jobId: randomId(),
    originalImageUrl: pair.original,
    generatedImageUrl: pair.generated,
  };
}
