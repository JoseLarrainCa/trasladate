// Formspree endpoint for email notifications
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkoygbva';

export async function sendToFormspree(data: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.error('Formspree error:', err);
    return false;
  }
}
