interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY 환경변수가 없습니다.')

  const recipients = Array.isArray(to)
    ? to.map(email => ({ email }))
    : [{ email: to }]

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Vertex AI 골프 코칭', email: 'noreply@golf.dbzone.kr' },
      to: recipients,
      subject,
      htmlContent: html,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}
