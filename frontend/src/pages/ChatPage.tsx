import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '@/store'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  const { sessionId } = useParams()
  const { setActiveSession } = useChatStore()

  useEffect(() => {
    if (!sessionId) {
      setActiveSession(null)
    }
  }, [sessionId, setActiveSession])

  return (
    <div className="h-full flex flex-col">
      <ChatInterface />
    </div>
  )
}
