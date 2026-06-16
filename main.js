window.onload = function() {
    const savedCity = localStorage.getItem("lastCity");
    if (savedCity) {
        // إذا كان هناك مدينة محفوظة، قم بجلب بياناتها
        getWeatherData(savedCity);
    }
};

function getWeatherData(city) {
    const apiKey = "afafaed475ef89bde7b7c39a061ef718";
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
    let myRequest = new XMLHttpRequest();
    myRequest.open("GET", url, true);
    myRequest.send();
    myRequest.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
        let data = JSON.parse(this.responseText);
        globalForecastData = data.list;
        updateUI(data);
        
        // استدعاء دالة تحديث القائمة بعد أن أصبحت المصفوفة مليئة بالبيانات
        populateSelectWithAvailableDays(); 
    }
};

    
}

document.querySelector("#searchBtn").addEventListener("click", () => {
    let city = document.querySelector("#searchInp").value;
    getWeatherData(city);
    localStorage.setItem("lastCity", city); 
});
function updateUI(data) {
    // 1. تحديث اسم المدينة
    document.querySelector("#city").innerHTML = `${data.city.name}, ${data.city.country}`;
    
    // 2. تحديث درجة الحرارة الحالية
    document.querySelector(".num h1").innerHTML = `${Math.round(data.list[0].main.temp)}°`;
    
    // 3. تحديث معلومات الـ info-day
    document.querySelector(".feels-val").innerHTML = `${Math.round(data.list[0].main.feels_like)}°`;
    document.querySelector(".humidity-val").innerHTML = `${data.list[0].main.humidity}%`;
    document.querySelector(".wind-val").innerHTML = `${data.list[0].wind.speed} km/h`;
    document.querySelector(".rain-val").innerHTML = `0 mm`;

    // 4. تحديث معلومات الأسبوع (نمرر المصفوفة بالكامل)
    updateDailyForecast(data.list);
  
    // 5. تحديث الأيقونة الرئيسية للطقس الحالي
    updateIcon(data.list[0].weather[0].main, document.querySelector(".num i"));
    //6. تحديث درجات الحرارة بالساعة
    updateForecastUI(data.list);
}

function updateDailyForecast(list) {
    const dayCards = document.querySelectorAll(".day-card");
    dayCards.forEach((card, index) => {
        const dataIndex = index * 8;
        const forecast = list[dataIndex];

        if (!forecast) return; // حماية في حال انتهت البيانات
        const dayName = card.querySelector("p:first-child");
        const icon = card.querySelector("i");
        const maxTemp = card.querySelector("span:first-child");
        const minTemp = card.querySelector("span:last-child");

        // 1. تحديث اليوم
        const date = new Date(forecast.dt_txt);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dayName.innerHTML = dayNames[date.getDay()];

        // 2. تحديث درجات الحرارة
        maxTemp.innerHTML = `${Math.round(forecast.main.temp_max)}°`;
        minTemp.innerHTML = `${Math.round(forecast.main.temp_min)}°`;
        
        // 3. تحديث الأيقونة
        updateIcon(forecast.weather[0].main, icon);
    });
}

function updateIcon(status, element) {
    const iconMap = {
        "Clear": "wi-day-sunny",
        "Clouds": "wi-cloudy",
        "Rain": "wi-rain",
        "Snow": "wi-snow",
        "Thunderstorm": "wi-thunderstorm",
        "Drizzle": "wi-showers",
        "Mist": "wi-fog",
        "Fog": "wi-fog",
        "Windy": "wi-strong-wind"
    };
    const iconClass = iconMap[status] || "wi-day-cloudy";
    element.className = `wi ${iconClass}`;
}

function updateForecastUI(list) {
    const forecastItems = document.querySelectorAll(".forecast-item");
    forecastItems.forEach(item => item.style.display = "none");

    list.forEach((forecastData, index) => {
        if (index < forecastItems.length) {
            const item = forecastItems[index];
            item.style.display = "flex";
            item.querySelector("p").innerHTML = `${Math.round(forecastData.main.temp)}°`;
            
            const date = new Date(forecastData.dt_txt);
            const hours = date.getHours();
            item.querySelector("h3").innerHTML = `${hours % 12 || 12} ${hours >= 12 ? 'PM' : 'AM'}`;
            
            updateIcon(forecastData.weather[0].main, item.querySelector("i"));
        }
    });
}

let globalForecastData = [];

// دالة تحديث التوقعات حسب اليوم المختار
function filterForecastByDay(dayName) {
    const filteredData = globalForecastData.filter(item => {
        const date = new Date(item.dt_txt);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return dayNames[date.getDay()].toLowerCase() === dayName.toLowerCase();
    });

    console.log(`تم العثور على ${filteredData.length} قراءات ليوم ${dayName}`);
    if (filteredData.length > 0) {
        updateForecastUI(filteredData);
    } else {
        console.warn("لا توجد بيانات لهذا اليوم في مصفوفة الـ API");
    }
}


// 3. تغيير القائمة
document.querySelector("#day").addEventListener("change", (e) => {
    filterForecastByDay(e.target.value);
});

function populateSelectWithAvailableDays() {
    const select = document.querySelector("#day");
    select.innerHTML = '';
    const days = [...new Set(globalForecastData.map(item => {
        return new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'long' });
    }))];

    days.forEach(day => {
        const option = document.createElement("option");
        option.value = day.toLowerCase();
        option.textContent = day;
        select.appendChild(option);
    });
}

document.querySelector("#unit").addEventListener("change", (e) => {
    const selectedUnit = e.target.value;
    const displayElement = document.querySelector(".main-temp");
    
    // حماية: إذا لم يجد العنصر
    if (!displayElement) {
        console.error("لم يتم العثور على العنصر .main-temp");
        return;
    }

    // التأكد من وجود بيانات
    if (globalForecastData.length === 0) {
        console.warn("لا توجد بيانات طقس متاحة حالياً");
        return;
    }

    const currentData = globalForecastData[0];

    switch (selectedUnit) {
        case "temperature":
            displayElement.innerHTML = `${Math.round(currentData.main.temp)}°`;
            break;
        case "humidity":
            displayElement.innerHTML = `${currentData.main.humidity}%`;
            break;
        case "wind":
            displayElement.innerHTML = `${currentData.wind.speed} km/h`;
            break;
        case "precipitation":
            const rain = (currentData.rain && currentData.rain['3h']) ? currentData.rain['3h'] : 0;
            displayElement.innerHTML = `${rain} mm`;
            break;
        default:
            displayElement.innerHTML = `${Math.round(currentData.main.temp)}°`;
    }
});

const element = document.getElementById('date-display');
const now = new Date();
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
});

element.textContent = dateString;

                
