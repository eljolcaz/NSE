import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hola, soy tu asistente de GastroLogix AI. ¿En qué puedo ayudarte hoy con tu inventario o cadena de suministro?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Store chat session in ref to persist across renders
  const chatSessionRef = useRef<any>(null);
  const { isAuthenticated, token } = useAuth();

  const fetchContextData = async () => {
    if (!token) return null;
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      // Fetch data based on user role or general data
      // We'll try to fetch as much as possible that the user has access to
      const [productsRes, ordersRes, suppliersRes] = await Promise.all([
        fetch('/api/products', { headers }).catch(() => ({ json: () => [] })),
        fetch('/api/orders', { headers }).catch(() => ({ json: () => [] })),
        fetch('/api/suppliers', { headers }).catch(() => ({ json: () => [] }))
      ]);
      
      const products = await productsRes.json();
      const orders = await ordersRes.json();
      const suppliers = await suppliersRes.json();
      
      return { products, orders, suppliers };
    } catch (error) {
      console.error("Error fetching context data:", error);
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initialize chat session once
  useEffect(() => {
    const initChat = async () => {
      // Always re-initialize if not present or to refresh context on mount/auth change
      // But to avoid too many re-inits, we can check if it's already done or just do it once per auth session
      // For now, let's do it if chatSessionRef is null
      if (!chatSessionRef.current && isAuthenticated) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          
          const contextData = await fetchContextData();
          let contextString = "";
          
          if (contextData) {
             // Limit data to avoid token limits if necessary, but flash models handle large context well
             const productsStr = JSON.stringify(contextData.products);
             // Take last 20 orders
             const ordersStr = JSON.stringify(Array.isArray(contextData.orders) ? contextData.orders.slice(0, 20) : []);
             const suppliersStr = JSON.stringify(contextData.suppliers);
             
             contextString = `
               DATOS DEL SISTEMA (Contexto Actual):
               - Productos (Inventario): ${productsStr}
               - Pedidos Recientes: ${ordersStr}
               - Proveedores: ${suppliersStr}
             `;
          }

          chatSessionRef.current = ai.chats.create({
            model: "gemini-2.0-flash",
            config: {
              systemInstruction: `Eres un asistente experto en gestión de inventarios para restaurantes llamado GastroLogix AI. 
              Ayudas a los usuarios a entender sus datos, sugerir pedidos y optimizar su cadena de suministro. 
              Tus respuestas deben ser concisas, profesionales y útiles. 
              El usuario es un dueño de restaurante o encargado de bodega.
              
              ${contextString}
              
              Usa esta información para responder preguntas específicas sobre el estado del inventario, pedidos pendientes, proveedores, etc.
              Si te preguntan por algo que no está en los datos, indícalo amablemente.`
            }
          });
        } catch (error) {
          console.error("Failed to initialize Gemini AI:", error);
        }
      }
    };
    
    if (isAuthenticated) {
      initChat();
    }
  }, [isAuthenticated, token]); // Add token to dependency to re-fetch if token changes (login)

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        // Re-try initialization if it failed or hasn't happened yet
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        
        const contextData = await fetchContextData();
        let contextString = "";
        
        if (contextData) {
           const productsStr = JSON.stringify(contextData.products);
           const ordersStr = JSON.stringify(Array.isArray(contextData.orders) ? contextData.orders.slice(0, 20) : []);
           const suppliersStr = JSON.stringify(contextData.suppliers);
           
           contextString = `
             DATOS DEL SISTEMA (Contexto Actual):
             - Productos (Inventario): ${productsStr}
             - Pedidos Recientes: ${ordersStr}
             - Proveedores: ${suppliersStr}
           `;
        }

        chatSessionRef.current = ai.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: `Eres un asistente experto en gestión de inventarios para restaurantes llamado GastroLogix AI. 
            Ayudas a los usuarios a entender sus datos, sugerir pedidos y optimizar su cadena de suministro. 
            Tus respuestas deben ser concisas, profesionales y útiles. 
            El usuario es un dueño de restaurante o encargado de bodega.
            
            ${contextString}
            
            Usa esta información para responder preguntas específicas sobre el estado del inventario, pedidos pendientes, proveedores, etc.
            Si te preguntan por algo que no está en los datos, indícalo amablemente.`
          }
        });
      }

      const chat = chatSessionRef.current;
      // Send message using the new SDK format
      const result = await chat.sendMessage({ message: userMessage });
      const response = result.text;

      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error: any) {
      console.error("Error calling Gemini:", error);
      let errorMessage = "Lo siento, tuve un problema al procesar tu solicitud.";
      if (error.message?.includes('API key')) {
        errorMessage += " Parece haber un problema con la clave API.";
      } else if (error.message?.includes('model')) {
        errorMessage += " El modelo de IA no está disponible en este momento.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show chatbot if authenticated
  if (!isAuthenticated) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 md:right-8 w-[90vw] md:w-[400px] h-[500px] bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Asistente GastroLogix</h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Powered by Gemini
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0f172a]">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700"
                  )}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span className="text-xs text-slate-500">Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors z-50 flex items-center justify-center"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
