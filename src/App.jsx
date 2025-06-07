// فایل: src/App.jsx
// این کد با فیلدهای جدید برای "پلاک" و "شماره تلفن" و همچنین گزینه‌های جدید "نوع فروشگاه" به‌روز شده است.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, LogOut, MapPin, Route, Plus, X, Check, ArrowRight, Map, Compass, AlertCircle } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

// --- Firebase Initialization ---
try {
    if (firebase.apps.length === 0) {
        const firebaseConfig = {
          apiKey: "AIzaSyAOR8pucoPj9xEnuuKdQyG72YdBzcRwMXE",
          authDomain: "visitorreportapp.firebaseapp.com",
          projectId: "visitorreportapp",
          storageBucket: "visitorreportapp.firebasestorage.app",
          messagingSenderId: "328308200277",
          appId: "1:328308200277:web:de07037a934ab15d8655dc",
          measurementId: "G-9ZFQ590XWY"
        };
        firebase.initializeApp(firebaseConfig);
    }
} catch (error) {
    console.error("Critical Firebase Init Error:", error);
}

const auth = firebase.auth();
const db = firebase.firestore();
const FieldValue = firebase.firestore.FieldValue;
ChartJS.register(ArcElement, Tooltip, Legend);


// --- Helper Components ---
const Spinner = () => <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>;
const ErrorMessage = ({ message }) => message ? <p className="text-red-500 text-sm text-center min-h-[20px]">{message}</p> : <div className="min-h-[20px]"></div>;
const SuccessMessage = ({ message }) => message ? <p className="text-green-600 text-sm text-center min-h-[20px]">{message}</p> : <div className="min-h-[20px]"></div>;


// --- Auth Component ---
function AuthComponent() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                if (!name.trim()) throw new Error('لطفاً نام و نام خانوادگی خود را وارد کنید.');
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: userCredential.user.email,
                    createdAt: FieldValue.serverTimestamp()
                });
            }
        } catch (err) {
            setError(getFirebaseErrorMessage(err));
            console.error("Auth error:", err);
        } finally {
            setLoading(false);
        }
    };
    
    const getFirebaseErrorMessage = (error) => {
        switch (error.code) {
            case 'auth/invalid-email': return 'فرمت ایمیل نامعتبر است.';
            case 'auth/user-not-found':
            case 'auth/wrong-password': 
            case 'auth/invalid-login-credentials':
                 return 'ایمیل یا رمز عبور اشتباه است.';
            case 'auth/email-already-in-use': return 'این ایمیل قبلاً ثبت‌نام شده است.';
            case 'auth/weak-password': return 'رمز عبور ضعیف است (حداقل ۶ کاراکتر).';
            default: return 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-2xl font-semibold text-center text-sky-700 mb-6">{isLogin ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری جدید'}</h2>
                {!isLogin && (
                    <div>
                        <label htmlFor="name-input" className="block text-sm font-medium text-gray-700">نام و نام خانوادگی:</label>
                        <input type="text" id="name-input" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"/>
                    </div>
                )}
                <div>
                    <label htmlFor="email-input" className="block text-sm font-medium text-gray-700">ایمیل:</label>
                    <input type="email" id="email-input" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-gray-700">رمز عبور:</label>
                    <input type="password" id="password-input" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"/>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400">
                    {loading ? <Spinner /> : (isLogin ? 'ورود' : 'ثبت‌نام')}
                </button>
                <ErrorMessage message={error} />
                <p className="text-center text-sm">
                    {isLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت‌نام کرده‌اید؟ '}
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-sky-600 hover:text-sky-500">
                        {isLogin ? 'ثبت‌نام کنید' : 'وارد شوید'}
                    </button>
                </p>
            </form>
        </div>
    );
}

// --- Main App Component ---
function App() {
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                setUser(user);
                if (userDoc.exists) {
                    setUserName(userDoc.data().name);
                }
            } else {
                setUser(null);
                setUserName('');
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = () => auth.signOut();

    if (loadingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-100 font-vazir">
                <div className="flex items-center text-lg text-gray-500">
                    <span className="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full ml-3"></span>
                    در حال بارگذاری...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-vazir">
            {!user ? (
                <AuthComponent />
            ) : (
                <div className="container mx-auto p-4 max-w-7xl">
                    <header className="mb-6 p-4 bg-white shadow-lg rounded-xl">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <h1 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">اپلیکیشن گزارش ویزیت</h1>
                            <div className="text-sm">
                                <span>کاربر: {userName || user.email}</span>
                                <button onClick={handleLogout} className="mr-4 px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600">
                                    <LogOut size={14} className="inline-block ml-1" />
                                    خروج
                                </button>
                            </div>
                        </div>
                    </header>
                    <MainApp />
                </div>
            )}
        </div>
    );
}


// --- Main App Logic Component (Post-Login) ---
function MainApp() {
    const [view, setView] = useState('choice'); // 'choice', 'scheduled', 'adhoc'

    if (view === 'scheduled') {
        return <ScheduledVisitFlow onBack={() => setView('choice')} />;
    }
    if (view === 'adhoc') {
        return <NewVisitFlow onBack={() => setView('choice')} />;
    }

    return (
        <div id="initial-choice-screen">
             <h2 className="text-2xl font-semibold text-center text-slate-700 mb-8">نوع ویزیت خود را انتخاب کنید:</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <button onClick={() => setView('scheduled')} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center">
                    <Route size={48} className="text-blue-500 mb-3" />
                    <span className="text-xl font-semibold text-slate-700">مسیر ویزیت برنامه‌ریزی شده</span>
                    <p className="text-sm text-gray-500 mt-1">انتخاب از لیست تاریخ‌ها و مکان‌های از پیش تعیین شده.</p>
                </button>
                <button onClick={() => setView('adhoc')} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center">
                    <MapPin size={48} className="text-purple-500 mb-3" />
                    <span className="text-xl font-semibold text-slate-700">ثبت ویزیت جدید</span>
                    <p className="text-sm text-gray-500 mt-1">ثبت گزارش برای یک مکان جدید با استفاده از موقعیت فعلی.</p>
                </button>
             </div>
        </div>
    );
}

// --- Components for Scheduled Visit Flow ---
function ScheduledVisitFlow({ onBack }) {
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        const unsubscribe = db.collection('schedules').orderBy('date', 'asc')
            .onSnapshot(snapshot => {
                const schedulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSchedules(schedulesData);
                setLoadingSchedules(false);
            }, (error) => {
                console.error("Error fetching schedules:", error);
                setLoadingSchedules(false);
            });
        return () => unsubscribe();
    }, []);

    const handleSelectDate = (schedule) => {
        setSelectedDate(schedule);
        setSelectedLocation(null);
    };
    
    const handleBackToChoice = () => {
        setSelectedDate(null);
        setSelectedLocation(null);
        onBack();
    };

    if (loadingSchedules) {
        return <div className="text-center p-4">در حال بارگذاری برنامه‌ها...</div>;
    }

    return (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <aside className="md:col-span-1 bg-white p-6 rounded-xl shadow-xl flex flex-col min-h-[70vh]">
                {!selectedDate ? (
                     <>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-blue-200">
                           <h2 className="text-2xl font-semibold text-blue-700 flex items-center">
                               <Route size={24} className="ml-2" />
                               انتخاب تاریخ ویزیت
                           </h2>
                           <button onClick={handleBackToChoice} className="p-2 text-sm text-sky-600 hover:text-sky-800 flex items-center transition-colors">
                               <ArrowRight size={16} className="ml-1"/> بازگشت 
                           </button>
                        </div>
                        {schedules.length === 0 ? (
                             <p className="text-gray-500 p-4">هیچ برنامه ویزیت فعالی یافت نشد.</p>
                        ) : (
                            <ul className="space-y-3 flex-grow overflow-y-auto pr-2 scroll-container">
                                {schedules.map(schedule => (
                                    <li key={schedule.id}>
                                      <button onClick={() => handleSelectDate(schedule)} className="w-full text-right p-4 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-between bg-slate-50 hover:bg-blue-100 hover:shadow-sm text-gray-700 border border-slate-200">
                                        <span className="font-semibold">{schedule.dateLabel}</span>
                                        <ChevronLeft size={20} className="text-gray-400" />
                                      </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <>
                         <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-blue-200">
                            <h2 className="text-xl font-semibold text-blue-700">مکان‌های ویزیت</h2>
                            <button onClick={() => setSelectedDate(null)} className="p-2 text-sm text-sky-600 hover:text-sky-800 flex items-center transition-colors">
                               <ArrowRight size={16} className="ml-1"/> بازگشت به تاریخ‌ها
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{selectedDate.dateLabel}</p>
                         <ul className="space-y-3 flex-grow overflow-y-auto pr-2 scroll-container">
                            {selectedDate.locations.map(location => (
                                <li key={location.id}>
                                    <button onClick={() => setSelectedLocation(location)} 
                                        className={`w-full text-right p-4 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-between border ${selectedLocation?.id === location.id ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300' : 'bg-slate-50 hover:bg-blue-100 text-gray-700 border-slate-200'}`}>
                                        <div className="ml-3">
                                            <span className="font-semibold block">{location.name}</span>
                                            <span className="text-xs">{location.address}</span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </aside>
            <section className="md:col-span-2 bg-white p-6 rounded-xl shadow-xl min-h-[70vh]">
                 {!selectedLocation ? (
                     <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Map size={48} className="mb-4 text-gray-400"/>
                        <p className="text-xl">لطفاً یک مکان را از لیست انتخاب کنید.</p>
                    </div>
                 ) : (
                    <LocationDetail location={selectedLocation} key={selectedLocation.id} />
                 )}
            </section>
        </main>
    );
}

function LocationDetail({ location }) {
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [submissionStatus, setSubmissionStatus] = useState({ success: '', error: '' });

    useEffect(() => {
        if (!location?.id || !auth.currentUser?.uid) return;
        setLoadingReports(true);

        const reportsRef = db.collection(`users/${auth.currentUser.uid}/reports`)
                             .where("locationId", "==", location.id);
        
        const unsubscribe = reportsRef.onSnapshot(snapshot => {
            const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            reportsData.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setReports(reportsData);
            setLoadingReports(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoadingReports(false);
        });

        return () => unsubscribe();
    }, [location.id]);

    const handleReportSubmission = useCallback(async (isOrderPlaced, reason = '') => {
        setSubmissionStatus({ success: '', error: '' });
        try {
            if (!auth.currentUser) throw new Error("کاربر وارد نشده است.");
            const reportData = {
                locationId: location.id,
                locationName: location.name,
                orderPlaced: isOrderPlaced,
                noOrderReason: reason,
                timestamp: FieldValue.serverTimestamp(),
                visitorId: auth.currentUser.uid,
                isScheduled: true
            };
            await db.collection(`users/${auth.currentUser.uid}/reports`).add(reportData);
            setSubmissionStatus({ success: 'گزارش با موفقیت ثبت شد!', error: ''});
        } catch (err) {
            console.error("Error submitting report:", err);
            setSubmissionStatus({ success: '', error: 'خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.'});
        } finally {
            setTimeout(() => setSubmissionStatus({ success: '', error: '' }), 4000);
        }
    }, [location]);
    
    const chartData = {
        labels: ['سفارش ثبت شد', 'سفارش ثبت نشد'],
        datasets: [{
            data: [
                reports.filter(r => r.orderPlaced).length,
                reports.filter(r => !r.orderPlaced).length
            ],
            backgroundColor: ['#10B981', '#EF4444'],
            borderColor: ['#D1FAE5', '#FEE2E2'],
            borderWidth: 2,
        }]
    };

    const mapsLink = (location.latitude && location.longitude) 
        ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : `https://www.google.com/maps?q=${encodeURIComponent(location.address)}`;

    return (
        <div>
            <div className="mb-6 pb-3 border-b border-gray-200">
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <h2 className="text-2xl font-bold text-sky-700 mb-1">{location.name}</h2>
                        <p className="text-sm text-gray-600">{location.address}</p>
                    </div>
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-200 shadow-md">
                        <Compass size={18} className="ml-2" /> مسیریابی
                    </a>
                </div>
            </div>
            
            <OrderReportingUI onReportSubmit={handleReportSubmission} uniqueId={location.id} />
            <SuccessMessage message={submissionStatus.success} />
            <ErrorMessage message={submissionStatus.error} />

            <div className="mt-8">
                 <h3 className="text-xl font-semibold mb-4 text-sky-700">تاریخچه و آمار</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {loadingReports ? (
                            <p>در حال بارگذاری تاریخچه...</p>
                        ) : reports.length === 0 ? (
                            <p className="text-gray-500 italic">هنوز گزارشی برای این مکان ثبت نشده است.</p>
                        ) : (
                            <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scroll-container">
                               {reports.map(report => (
                                    <li key={report.id} className={`p-4 rounded-lg border shadow-sm ${report.orderPlaced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                       <div className="flex items-center font-semibold">{report.orderPlaced ? 
                                            <><Check size={20} className="ml-2 text-green-700"/> سفارش ثبت شد</> : 
                                            <><X size={20} className="ml-2 text-red-700"/> سفارشی ثبت نشد</>}
                                        </div>
                                       {report.noOrderReason && <p className="mt-1 text-sm text-gray-600"><span className="font-medium">دلیل:</span> {report.noOrderReason}</p>}
                                       <p className="text-xs text-gray-500 mt-2 text-left">{report.timestamp ? new Date(report.timestamp.toDate()).toLocaleString('fa-IR') : ''}</p>
                                    </li>
                               ))}
                            </ul>
                        )}
                    </div>
                    <div className="lg:col-span-1 flex flex-col items-center">
                        {reports.length > 0 && (
                             <div className="chart-container">
                                <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: {font: {family: "'Vazirmatn', sans-serif"}}}}}} />
                            </div>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    );
}

// --- Components for New "Ad-hoc" Visit Flow ---
function NewVisitFlow({ onBack }) {
    const [locationName, setLocationName] = useState('');
    const [storeType, setStoreType] = useState('');
    const [plaque, setPlaque] = useState(''); // New state for plaque
    const [phone, setPhone] = useState(''); // New state for phone
    const [coords, setCoords] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [geoError, setGeoError] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState({ success: '', error: '' });

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setGeoError('مرورگر شما از دریافت موقعیت مکانی پشتیبانی نمی‌کند.');
            return;
        }
        setIsGettingLocation(true);
        setGeoError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsGettingLocation(false);
            },
            (error) => {
                let message = 'خطا در دریافت موقعیت.';
                if(error.code === 1) message = 'اجازه دسترسی به موقعیت مکانی داده نشد.';
                setGeoError(message);
                console.error("Geolocation Error:", error);
                setIsGettingLocation(false);
            }
        );
    };

    const handleAdhocReportSubmission = useCallback(async (isOrderPlaced, reason = '') => {
        if (!locationName.trim()) {
            setSubmissionStatus({ error: 'لطفاً نام مکان را وارد کنید.', success: '' });
            return;
        }
        if (!storeType) {
            setSubmissionStatus({ error: 'لطفاً نوع فروشگاه را انتخاب کنید.', success: '' });
            return;
        }

        setSubmissionStatus({ success: '', error: '' });
        try {
            if (!auth.currentUser) throw new Error("کاربر وارد نشده است.");
            
            const reportData = {
                locationName,
                storeType,
                plaque: plaque.trim(), // Add plaque
                phone: phone.trim(), // Add phone
                orderPlaced: isOrderPlaced,
                noOrderReason: reason,
                timestamp: FieldValue.serverTimestamp(),
                visitorId: auth.currentUser.uid,
                isScheduled: false,
                ...(coords && { latitude: coords.latitude, longitude: coords.longitude }) 
            };
            await db.collection(`users/${auth.currentUser.uid}/adhocReports`).add(reportData);
            setSubmissionStatus({ success: 'گزارش ویزیت جدید با موفقیت ثبت شد!', error: ''});
            
            // Reset form
            setLocationName('');
            setStoreType('');
            setPlaque('');
            setPhone('');
            setCoords(null);
            setGeoError('');
        } catch (err) {
            console.error("Error submitting adhoc report:", err);
            setSubmissionStatus({ success: '', error: 'خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.'});
        } finally {
            setTimeout(() => setSubmissionStatus({ success: '', error: '' }), 4000);
        }
    }, [locationName, storeType, plaque, phone, coords]);

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-xl">
            <button onClick={onBack} className="mb-6 text-sm text-sky-600 hover:text-sky-800 flex items-center">
                <ArrowRight size={16} className="ml-1" />
                بازگشت به انتخاب نوع ویزیت
            </button>
            <h2 className="text-2xl font-semibold text-center text-purple-700 mb-6">ثبت ویزیت جدید (خارج از برنامه)</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="adhoc-location-name" className="block text-sm font-medium text-gray-700">نام مکان (ضروری):</label>
                    <input type="text" id="adhoc-location-name" value={locationName} onChange={(e) => setLocationName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="adhoc-plaque" className="block text-sm font-medium text-gray-700">پلاک (اختیاری):</label>
                    <input type="text" id="adhoc-plaque" value={plaque} onChange={(e) => setPlaque(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="adhoc-phone" className="block text-sm font-medium text-gray-700">شماره تلفن (اختیاری):</label>
                    <input type="tel" id="adhoc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="adhoc-store-type" className="block text-sm font-medium text-gray-700">نوع فروشگاه (ضروری):</label>
                    <select id="adhoc-store-type" value={storeType} onChange={(e) => setStoreType(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                        <option value="">انتخاب کنید...</option>
                        <option value="pharmacy">داروخانه</option>
                        <option value="supermarket">سوپرمارکت</option>
                        <option value="detergent-hygienic">شوینده بهداشتی</option>
                        <option value="cosmetic-hygienic">آرایشی بهداشتی</option>
                        <option value="pet-shop">پت شاپ</option>
                        <option value="wholesaler">عمده فروش</option>
                        <option value="other">سایر</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">موقعیت مکانی:</label>
                    <button type="button" onClick={getCurrentLocation} disabled={isGettingLocation} className="mt-1 mb-2 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 disabled:bg-gray-400">
                        {isGettingLocation ? <Spinner /> : <Compass size={18} className="ml-2" />}
                        دریافت موقعیت مکانی فعلی
                    </button>
                    {coords && <p className="text-xs text-green-600">مختصات: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</p>}
                    {geoError && <p className="text-xs text-red-600">{geoError}</p>}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                    <OrderReportingUI onReportSubmit={handleAdhocReportSubmission} uniqueId="adhoc" />
                    <SuccessMessage message={submissionStatus.success} />
                    <ErrorMessage message={submissionStatus.error} />
                </div>
            </div>
        </div>
    );
}

// --- Reusable Order Reporting UI ---
function OrderReportingUI({ onReportSubmit, uniqueId }) {
    const [reason, setReason] = useState('');
    const [isNoOrderMode, setIsNoOrderMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNoOrderSubmit = async (e) => {
        e.preventDefault();
        if(!reason.trim() || isSubmitting) return;
        setIsSubmitting(true);
        await onReportSubmit(false, reason);
        setIsSubmitting(false);
        setIsNoOrderMode(false);
        setReason('');
    };

    const handleOrderYes = async () => {
        if(isSubmitting) return;
        setIsSubmitting(true);
        await onReportSubmit(true);
        setIsSubmitting(false);
    };

    const handleOrderNo = () => {
        setIsNoOrderMode(true);
    };
    
    const handleCancel = () => {
        setIsNoOrderMode(false);
        setReason('');
    };

    return (
        <div className="space-y-4">
            {!isNoOrderMode ? (
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleOrderYes} disabled={isSubmitting} className="flex-1 flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-md disabled:bg-gray-400">
                         {isSubmitting ? <Spinner /> : <Check size={18} className="ml-2" />} سفارش ثبت شد
                    </button>
                    <button onClick={handleOrderNo} disabled={isSubmitting} className="flex-1 flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md disabled:bg-gray-400">
                        <X size={18} className="ml-2" /> سفارشی ثبت نشد
                    </button>
                </div>
            ) : (
                <form onSubmit={handleNoOrderSubmit}>
                    <h4 className="text-md font-semibold mb-2 text-slate-600">دلیل عدم ثبت سفارش:</h4>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="توضیحات خود را اینجا بنویسید..." rows="4" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"></textarea>
                    <div className="mt-4 flex gap-3">
                        <button type="submit" disabled={!reason.trim() || isSubmitting} className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow disabled:bg-gray-400">
                            {isSubmitting ? <Spinner /> : 'ارسال دلیل'}
                        </button>
                        <button type="button" onClick={handleCancel} className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            انصراف
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default App;
