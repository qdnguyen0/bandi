import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  agent: { name: string; avatar: string; price: number; rental_rate: number }
  purchaseType: 'buy' | 'rent'
}

export default function CheckoutModal({ open, onClose, onSuccess, agent, purchaseType }: Props) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const price = purchaseType === 'rent' ? agent.rental_rate : agent.price

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setCardNumber('')
      setExpiry('')
      setCvc('')
      setProcessing(false)
      setSuccess(false)
    }
  }, [open])

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  const handlePay = async () => {
    setProcessing(true)
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1500))
    setProcessing(false)
    setSuccess(true)
    setTimeout(() => {
      onSuccess()
    }, 1200)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-[380px] rounded-lg overflow-hidden"
            style={{
              background: 'rgba(8,8,16,0.97)',
              border: '1px solid rgba(0,255,255,0.2)',
              boxShadow: '0 0 30px rgba(0,255,255,0.1), 0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(0,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-10 h-10 rounded"
                  style={{ border: '1px solid rgba(0,255,255,0.2)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white/90 font-mono truncate">{agent.name}</div>
                  <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
                    {purchaseType === 'rent' ? 'Monthly Rental' : 'One-time Purchase'}
                  </div>
                </div>
                <div
                  className="text-lg font-black font-mono"
                  style={{ color: '#00ffff', textShadow: '0 0 8px rgba(0,255,255,0.4)' }}
                >
                  ${price}
                </div>
              </div>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 flex flex-col items-center gap-3"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.4)' }}
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#00ff88" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-sm font-bold font-mono" style={{ color: '#00ff88' }}>Payment Successful</div>
                <div className="text-xs text-white/30 font-mono">Redirecting...</div>
              </motion.div>
            ) : (
              <div className="p-5">
                {/* Apple Pay button */}
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full py-2.5 rounded mb-4 text-sm font-bold tracking-wide transition-all cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#000',
                  }}
                >
                   Pay
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[10px] text-white/20 font-mono uppercase tracking-wider">Or pay with card</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Card form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider block mb-1">Card number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      className="input-neon w-full"
                      maxLength={19}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider block mb-1">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                        className="input-neon w-full"
                        maxLength={5}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 font-mono uppercase tracking-wider block mb-1">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cvc}
                        onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="input-neon w-full"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full mt-4 py-2.5 rounded text-sm font-bold font-mono uppercase tracking-widest transition-all cursor-pointer"
                  style={{
                    background: processing ? 'rgba(0,255,255,0.15)' : 'rgba(0,255,255,0.1)',
                    color: '#00ffff',
                    border: '1px solid rgba(0,255,255,0.4)',
                    boxShadow: processing ? 'none' : '0 0 15px rgba(0,255,255,0.15)',
                  }}
                >
                  {processing ? 'Processing...' : `Pay $${price}`}
                </button>

                <button
                  onClick={onClose}
                  className="w-full mt-2 py-1.5 text-xs font-mono text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
