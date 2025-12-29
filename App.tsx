
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category, TravelCard, Expense } from './types';
import { INITIAL_DATA } from './constants';
import { enrichTravelCard } from './geminiService';

const App: React.FC = () => {
  const [cards, setCards] = useState<TravelCard[]>([]);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'map' | 'me'>('itinerary');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('itinerary_v2_data');
    if (saved) {
      setCards(JSON.parse(saved));
    } else {
      setCards(INITIAL_DATA);
    }
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem('itinerary_v2_data', JSON.stringify(cards));
    }
  }, [cards]);

  const days = useMemo(() => {
    const daySet = new Set(cards.map(c => c.day));
    return Array.from(daySet).sort((a: number, b: number) => a - b);
  }, [cards]);

  const activeCards = useMemo(() => 
    cards.filter(c => !c.isDeleted && c.day === activeDay).sort((a, b) => a.time.localeCompare(b.time)),
    [cards, activeDay]
  );

  const accommodationCard = useMemo(() => 
    activeCards.filter(c => c.category === Category.LOGISTICS && c.title.includes('飯店') || c.title.includes('住宿') || c.title.includes('Stay'))[0],
    [activeCards]
  );

  const handleToggleDelete = (id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, isDeleted: !c.isDeleted } : c));
  };

  const handleAddCard = async (form: any) => {
    const { title, time, category, day } = form;
    const id = Date.now().toString();
    const enrichment = await enrichTravelCard(title, category);
    
    const newCard: TravelCard = {
      id,
      day,
      time,
      title,
      category,
      subTitle: enrichment?.subTitle || '',
      description: enrichment?.description || '',
      locationKeyword: enrichment?.locationKeyword || title,
      isDeleted: false,
      expenses: enrichment?.suggestedBudget ? [{ id: 'sugg', item: '預估支出', amount: enrichment.suggestedBudget }] : [],
      notes: []
    };

    setCards(prev => [...prev, newCard]);
    setIsAddModalOpen(false);
  };

  const dayTotal = useMemo(() => 
    activeCards.reduce((sum, card) => sum + card.expenses.reduce((s, e) => s + e.amount, 0), 0),
    [activeCards]
  );

  const WeatherWidget = () => (
    <div className="bg-gradient-to-br from-[#62A5D8] to-[#4A8CC7] rounded-[2rem] p-6 text-white mb-6 shadow-xl relative overflow-hidden transition-all active:scale-[0.98]">
      <div className="absolute top-4 right-6 opacity-20 text-7xl">
        <i className="fa-solid fa-cloud-sun"></i>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-gear text-sm opacity-80 animate-spin-slow"></i>
          <span className="font-bold text-lg">名古屋 天氣</span>
        </div>
        <p className="text-sm font-medium mb-1 opacity-90">多雲時晴</p>
        <h2 className="text-5xl font-black mb-4 tracking-tighter">7°C / -1°C</h2>
        <div className="flex items-center gap-2 text-[10px] font-black bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
          <i className="fa-solid fa-shirt"></i>
          建議穿搭：發熱衣 + 厚羽絨 + 圍巾
        </div>
      </div>
    </div>
  );

  const FlightCard = ({ card }: { card: TravelCard }) => (
    <div className="bg-[#1B4069] rounded-[2.5rem] p-1 mb-8 shadow-2xl text-white transform transition-all active:scale-[0.97]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-plane text-blue-300"></i>
          <span className="font-black text-sm uppercase tracking-widest">航班資訊</span>
        </div>
        <div className="flex gap-2">
          <button className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-black border border-white/5">
            <i className="fa-solid fa-pen-to-square mr-1"></i> 編輯
          </button>
          <button onClick={() => handleToggleDelete(card.id)} className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-black border border-white/5 text-rose-300">
            <i className="fa-solid fa-trash mr-1"></i> 刪除
          </button>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-lg rounded-[2.2rem] m-1 p-6 border border-white/10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-2xl font-black">{card.flightInfo?.flightNumber}</h4>
            <p className="text-[10px] opacity-40 font-bold">確認碼: {card.flightInfo?.confirmationCode || '---'}</p>
          </div>
          <div className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black border border-white/5">
            {card.flightInfo?.class} <span className="ml-2 opacity-50">{card.flightInfo?.duration}</span>
          </div>
        </div>
        <div className="flex justify-between items-center relative py-2">
          <div className="text-left w-1/3">
            <p className="text-[9px] opacity-40 font-black uppercase mb-1">起飛</p>
            <h5 className="text-3xl font-black">{card.time}</h5>
            <p className="text-[11px] font-black text-blue-200">{card.flightInfo?.origin}</p>
          </div>
          <div className="flex-1 flex justify-center items-center px-2">
             <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent relative">
               <i className="fa-solid fa-plane absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 scale-125"></i>
             </div>
          </div>
          <div className="text-right w-1/3">
            <p className="text-[9px] opacity-40 font-black uppercase mb-1">抵達</p>
            <h5 className="text-3xl font-black">{card.flightInfo?.arrivalTime || card.endTime || '--:--'}</h5>
            <p className="text-[11px] font-black text-blue-200">{card.flightInfo?.destination}</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-users opacity-40"></i>
            乘客: {card.flightInfo?.passengerNames?.join(' & ')}
          </div>
          {card.notes.length > 0 && <span className="opacity-60">{card.notes[0]}</span>}
        </div>
      </div>
    </div>
  );

  const ActivityCard = ({ card }: { card: TravelCard }) => (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 mb-6 transition-all active:scale-[0.98]">
      {card.imageUrl && (
        <div className="h-44 overflow-hidden relative">
          <img src={card.imageUrl} className="w-full h-full object-cover" alt={card.title} />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black shadow-sm">
            {card.time}
          </div>
        </div>
      )}
      <div className="p-7">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {!card.imageUrl && <div className="text-[10px] font-black text-blue-500 mb-2">{card.time}</div>}
            <h3 className="text-xl font-black text-gray-900 leading-tight">{card.title}</h3>
            {card.subTitle && <p className="text-sm font-bold text-gray-400 mt-1">{card.subTitle}</p>}
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsBudgetModalOpen(card.id)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                <i className="fa-solid fa-wallet text-sm"></i>
             </button>
             <button onClick={() => handleToggleDelete(card.id)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <i className="fa-solid fa-trash-can text-sm"></i>
             </button>
          </div>
        </div>
        
        {card.description && <p className="text-sm text-gray-500 leading-relaxed font-medium mb-6">{card.description}</p>}
        
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
             {card.locationKeyword && (
               <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.locationKeyword)}`} target="_blank" className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-[11px] font-black">
                 <i className="fa-solid fa-location-arrow"></i> 導航
               </a>
             )}
             <button className="flex items-center gap-2 bg-gray-50 text-gray-400 px-4 py-2 rounded-2xl text-[11px] font-black">
               <i className="fa-solid fa-globe"></i> 官網
             </button>
          </div>
          <button className="text-gray-300">
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 bg-[#F6F7FB] max-w-md mx-auto relative shadow-2xl font-sans overflow-x-hidden selection:bg-blue-100">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#E2EDF9] to-transparent -z-10 opacity-70"></div>

      {/* Header Section */}
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-center text-xl font-black text-gray-900 flex items-center justify-center gap-2 mb-10 tracking-tight">
          <span className="text-2xl">🌲</span> 2025 名古屋高山之旅
        </h1>

        {/* High-Fidelity Date Selector */}
        <div className="flex overflow-x-auto no-scrollbar gap-5 pb-6 px-1">
          <button 
            onClick={() => setActiveDay(0)}
            className={`flex-shrink-0 w-20 h-20 rounded-full flex flex-col items-center justify-center font-black border-2 transition-all ${
              activeDay === 0 ? 'bg-white border-blue-400 text-gray-900 scale-110 shadow-xl' : 'bg-white/40 border-transparent text-gray-400'
            }`}
          >
            <span className="text-sm">行前</span>
          </button>
          {days.filter(d => d > 0).map(d => {
            const date = new Date(2025, 0, 17 + d);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`flex-shrink-0 w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                  activeDay === d ? 'bg-[#98C1EA] border-blue-300 text-white scale-110 shadow-2xl' : 'bg-white border-transparent text-gray-400 shadow-sm'
                }`}
              >
                <span className="text-[10px] font-black uppercase opacity-60">Jan</span>
                <span className="text-2xl font-black leading-none my-0.5">{17 + d}</span>
                <span className="text-[10px] font-black uppercase opacity-60">{dayName}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-6 py-2">
        <WeatherWidget />

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="w-1.5 h-7 bg-blue-500 rounded-full inline-block"></span>
            今日行程
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-500 text-white font-black text-[11px] px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all">
              <i className="fa-solid fa-plus"></i> 新增行程
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {activeCards.length === 0 ? (
            <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-gray-200">
              <i className="fa-solid fa-calendar-day text-4xl text-gray-200 mb-4 block"></i>
              <p className="text-gray-300 font-black">這天暫無行程</p>
            </div>
          ) : (
            activeCards.map(card => (
              <div key={card.id}>
                {card.flightInfo ? (
                  <FlightCard card={card} />
                ) : (
                  <ActivityCard card={card} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Accommodation Section as seen in reference image */}
        {accommodationCard && (
          <div className="mt-12">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8">
              <span className="w-1.5 h-7 bg-rose-400 rounded-full inline-block"></span>
              今日住宿
            </h2>
            <div className="bg-white rounded-[3rem] p-2 shadow-xl border border-white mb-10 overflow-hidden">
               <div className="flex items-center p-4">
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden flex-shrink-0">
                     <img src={accommodationCard.imageUrl} className="w-full h-full object-cover" alt="Stay" />
                  </div>
                  <div className="ml-6 flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className="text-xl font-black text-gray-900">{accommodationCard.title}</h4>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodationCard.locationKeyword || accommodationCard.title)}`} target="_blank" className="bg-blue-500 text-white p-2.5 rounded-full shadow-lg shadow-blue-100 flex items-center justify-center">
                           <i className="fa-solid fa-location-arrow text-xs"></i>
                        </a>
                     </div>
                     <div className="mt-4 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                           <i className="fa-solid fa-hotel w-4"></i> 類型: 飯店/SPA
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                           <i className="fa-solid fa-location-dot w-4"></i> {accommodationCard.subTitle}
                        </div>
                     </div>
                  </div>
               </div>
               <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-8">
                  <i className="fa-solid fa-check text-green-500"></i> 已預訂完成
               </div>
            </div>
          </div>
        )}

        {activeCards.length > 0 && (
          <div className="mt-12 mb-12">
             <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-6">
              <span className="w-1.5 h-7 bg-orange-400 rounded-full inline-block"></span>
              當日預算
            </h2>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex justify-between items-center group active:bg-gray-50 transition-colors">
               <span className="font-bold text-gray-400 tracking-wider">今日支出總額</span>
               <span className="text-3xl font-black text-gray-900">¥ {dayTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
      </main>

      {/* Frosted Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[3rem] p-2 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-50">
        <button onClick={() => setActiveTab('itinerary')} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-full transition-all duration-300 ${activeTab === 'itinerary' ? 'bg-blue-500 text-white shadow-xl shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fa-solid fa-house text-lg"></i>
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">今日</span>
        </button>
        <button onClick={() => setActiveTab('map')} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-full transition-all duration-300 ${activeTab === 'map' ? 'bg-blue-500 text-white shadow-xl shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fa-solid fa-map-location-dot text-lg"></i>
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">地圖</span>
        </button>
        <button onClick={() => setActiveTab('budget')} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-full transition-all duration-300 ${activeTab === 'budget' ? 'bg-blue-500 text-white shadow-xl shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fa-solid fa-wallet text-lg"></i>
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">記帳</span>
        </button>
        <button onClick={() => setActiveTab('me')} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-full transition-all duration-300 ${activeTab === 'me' ? 'bg-blue-500 text-white shadow-xl shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fa-solid fa-user text-lg"></i>
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">我的</span>
        </button>
      </nav>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-end justify-center">
           <div className="bg-white w-full max-w-md rounded-t-[3.5rem] p-10 animate-in slide-in-from-bottom duration-500 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mb-10"></div>
              <h2 className="text-3xl font-black mb-10 text-center text-gray-900 tracking-tight">新增您的探險</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddCard({
                  title: formData.get('title'),
                  day: parseInt(formData.get('day') as string),
                  time: formData.get('time'),
                  category: formData.get('category') as Category,
                });
              }} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">景點或活動名稱</label>
                  <input required name="title" className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-5 outline-none focus:ring-2 ring-blue-500 font-bold text-lg" placeholder="去哪兒呢？" />
                </div>
                <div className="flex gap-5">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">日期</label>
                      <select name="day" className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-5 font-bold outline-none appearance-none">
                        {days.map(d => <option key={d} value={d}>Day {d}</option>)}
                      </select>
                   </div>
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">出發時間</label>
                      <input required name="time" type="time" className="w-full bg-gray-50 border-none rounded-[1.5rem] px-8 py-5 font-bold outline-none" defaultValue="09:00" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">分類</label>
                   <div className="grid grid-cols-3 gap-3">
                     {Object.values(Category).map(cat => (
                        <label key={cat} className="cursor-pointer">
                           <input type="radio" name="category" value={cat} className="hidden peer" defaultChecked={cat === Category.ACTIVITY} />
                           <div className="peer-checked:bg-blue-500 peer-checked:text-white bg-gray-50 text-gray-400 text-[10px] font-black py-4 rounded-[1.2rem] text-center uppercase tracking-tighter transition-all peer-checked:shadow-lg peer-checked:shadow-blue-100">
                              {cat}
                           </div>
                        </label>
                     ))}
                   </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 font-black text-gray-400 hover:text-gray-600 transition-colors">取消</button>
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 active:scale-95 transition-all">確認加入行程</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-lg flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">支出細項</h2>
                 <button onClick={() => setIsBudgetModalOpen(null)} className="text-gray-300 hover:text-gray-600">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                 </button>
              </div>
              <div className="space-y-5 mb-10 max-h-[300px] overflow-y-auto no-scrollbar">
                {cards.find(c => c.id === isBudgetModalOpen)?.expenses.length === 0 ? (
                  <div className="text-center py-8">
                     <p className="text-gray-300 text-sm font-bold italic">尚無支出紀錄</p>
                  </div>
                ) : (
                  cards.find(c => c.id === isBudgetModalOpen)?.expenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-100">
                       <span className="font-bold text-gray-700">{e.item}</span>
                       <span className="font-black text-blue-600 text-lg">¥{e.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setIsBudgetModalOpen(null)} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl active:scale-95 transition-all">
                確認
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
