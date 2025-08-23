export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const response = await fetch('https://api.enconvo.com/subscription/manage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client_id': '6',
                'Authorization': req.headers.authorization,
            },
            body: JSON.stringify(req.body),
        })

        const data = await response.json()
        res.status(200).json(data)
    } catch (error) {
        console.error('API error:', error)
        res.status(500).json({ message: 'Error managing subscription' })
    }
}
