import {  useEffect,useState } from "react";



const Chat = () => {
    const [messages,setMessages] = useState([])
    const [message,setMessage] = useState("")
    const [user,setUser] = useState("")
    

const fetchMessages = async () => {
		try {
			const response = await fetch('https://thechat-piox.onrender.com/messages');
			const data = await response.json();
			setMessages(data);
		} catch (error) {
			console.error('Error fetching messages:', error);
		}
	};

	const sendMessage = async () => {
		try {
			await fetch('https://thechat-piox.onrender.com/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ user, message }),
			});

		
			setMessage('');
			// Fetch messages to update the list
			fetchMessages();
		} catch (error) {
			console.error('Error sending message:', error);
		}
	};

	useEffect(() => {
		// Fetch messages on component mount
		fetchMessages();
		// Poll for new messages every 2 seconds
		const interval = setInterval(() => {
			fetchMessages();
		}, 2000);

		return () => clearInterval(interval);
	}, []); // Run only once on mount

	return (
		<div>
			<h2>Chat Room</h2>
			<ul>
				{messages.map((message) => (
					<li key={message._id}>
						<strong>{message.user}:</strong> {message.message}
					</li>
				))}
			</ul>
			<div>
				<input
					type="text"
					placeholder="Your name"
					value={user}
					onChange={(e) => setUser(e.target.value)}
				/>
				<input
					type="text"
					placeholder="Type your message..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
				<button onClick={sendMessage}>Send</button>
			</div>
		</div>
	);
}
 
export default Chat;