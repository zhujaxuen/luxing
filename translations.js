// ============================================================
// TRADUÇÕES — inglês (en) e mandarim (zh).
// O português continua vindo direto do data.js (é o idioma padrão/fonte).
// Cada bloco "stops" usa o MESMO id que está em data.js, então se você
// adicionar uma nova parada em data.js, adicione a tradução dela aqui
// também (em "en" e em "zh") ou ela vai aparecer em português.
// ============================================================

const TRANSLATIONS = {
  en: {
    trip: {
      title: "My trip to China",
      subtitle: "From Curitiba to China, via Istanbul",
    },

    ui: {
      startRotation: "Start rotation",
      stopRotation: "Stop rotation",
      overview: "Overview",
      hint: "drag to rotate · scroll to zoom",
      statsStops: "stops",
      statsKmSuffix: "km",
      countdownDays: (n) => `${n} days to go`,
      countdownOneDay: "1 day to go",
      countdownToday: "the trip starts today 🎉",
      countdownStarted: "the trip has already started 🎉",
      timelineDeslocamento: "Travel to China",
      timelineRoteiro: "Itinerary in China",
      timelineRetorno: "Return to Brazil",
      routeInfo: (km, city, duration, type) =>
        `<strong>${km} km</strong> to ${city} · about ${duration} by ${type}`,
    },

    routeLabels: {
      voo: "Flight",
      trem: "Train",
      metro: "Metro",
      onibus: "Bus",
    },

    stops: {
      curitiba: {
        name: "Curitiba",
        date: "Oct 09",
        tag: "Departure",
        description: "Departure from Curitiba at 8:20 PM, heading to São Paulo.",
      },
      "sao-paulo": {
        name: "São Paulo",
        date: "Oct 09–10",
        tag: "Layover",
        description: "Arrival from Curitiba, connecting to Istanbul on 10/10.",
      },
      istambul: {
        name: "Istanbul",
        date: "Oct 10–11",
        tag: "Layover",
        description: "Arrival on 10/10, departing on 10/11 to Guangzhou.",
      },
      guangzhou: {
        name: "Guangzhou",
        date: "Oct 12",
        tag: "Arrival",
        description: "Arrival on Monday, 10/12. Day trip to Shenzhen the same day.",
      },
      shenzhen: {
        name: "Shenzhen",
        date: "Oct 12–15",
        tag: "Shopping",
        description: "Staying in Shenzhen from 10/12 to 10/15. Metro trip to Hong Kong on 10/14.",
      },
      "hong-kong": {
        name: "Hong Kong",
        date: "Oct 14",
        tag: "Kowloon Bay",
        description: "Day trip from Shenzhen, returning by metro.",
      },
      "guangzhou-local": {
        name: "Guangzhou",
        date: "Oct 15–17",
        tag: "Canton Fair",
        description: "Metro back from Shenzhen to Guangzhou on 10/15. Staying until 10/17.",
      },
      beijing: {
        name: "Beijing",
        date: "Oct 17–21",
        tag: "Great Wall of China",
        description: "Flight from Guangzhou on 10/17. Staying until 10/21.",
      },
      nanjing: {
        name: "Nanjing",
        date: "Oct 21–24",
        tag: "Ming City Wall",
        description: "Train from Beijing on 10/21. Staying until 10/24.",
      },
      yangzhou: {
        name: "Yangzhou",
        date: "Oct 24–27",
        tag: "Family ❤️",
        description: "Staying in Yangzhou from 10/24 to 10/27.",
      },
      shanghai: {
        name: "Shanghai",
        date: "Oct 27–30",
        tag: "The Bund",
        description: "Arrival on 10/27. Staying until 10/30, then flying back to Guangzhou.",
      },
      "guangzhou-retorno": {
        name: "Guangzhou",
        date: "Oct 30",
        tag: "Return",
        description: "Flight back from Shanghai to Guangzhou on 10/30.",
      },
      "istambul-retorno": {
        name: "Istanbul",
        date: "Oct 31",
        tag: "Layover",
        description: "Stopover in Istanbul on the flight back to Brazil.",
      },
      "saopaulo-retorno": {
        name: "São Paulo",
        date: "Oct 31",
        tag: "Layover",
        description: "Arrival in São Paulo on 10/31, after the Istanbul layover.",
      },
      "curitiba-retorno": {
        name: "Curitiba",
        date: "Nov 01",
        tag: "Return",
        description: "Arrival in Curitiba on 11/01, wrapping up the trip.",
      },
    },
  },

  zh: {
    trip: {
      title: "我的中国之旅",
      subtitle: "从库里蒂巴出发,经伊斯坦布尔前往中国",
    },

    ui: {
      startRotation: "开始旋转",
      stopRotation: "停止旋转",
      overview: "总览",
      hint: "拖动旋转 · 滚动缩放",
      statsStops: "个站点",
      statsKmSuffix: "公里",
      countdownDays: (n) => `还有 ${n} 天`,
      countdownOneDay: "还有 1 天",
      countdownToday: "今天出发啦 🎉",
      countdownStarted: "旅程已经开始 🎉",
      timelineDeslocamento: "前往中国",
      timelineRoteiro: "中国行程",
      timelineRetorno: "返回巴西",
      routeInfo: (km, city, duration, type) =>
        `距<strong>${city}</strong> ${km} 公里 · 约${duration}(${type})`,
    },

    routeLabels: {
      voo: "飞机",
      trem: "火车",
      metro: "地铁",
      onibus: "巴士",
    },

    stops: {
      curitiba: {
        name: "库里蒂巴",
        date: "10月9日",
        tag: "出发",
        description: "20:20从库里蒂巴出发,前往圣保罗。",
      },
      "sao-paulo": {
        name: "圣保罗",
        date: "10月9-10日",
        tag: "转机",
        description: "从库里蒂巴抵达,10月10日转机前往伊斯坦布尔。",
      },
      istambul: {
        name: "伊斯坦布尔",
        date: "10月10-11日",
        tag: "转机",
        description: "10月10日抵达,10月11日出发前往广州。",
      },
      guangzhou: {
        name: "广州",
        date: "10月12日",
        tag: "抵达",
        description: "周一(10月12日)抵达,当天前往深圳一日游。",
      },
      shenzhen: {
        name: "深圳",
        date: "10月12-15日",
        tag: "购物",
        description: "10月12日至15日在深圳停留,10月14日乘地铁前往香港游览。",
      },
      "hong-kong": {
        name: "香港",
        date: "10月14日",
        tag: "九龙湾",
        description: "从深圳出发的一日游,乘地铁返回。",
      },
      "guangzhou-local": {
        name: "广州",
        date: "10月15-17日",
        tag: "广交会",
        description: "10月15日乘地铁从深圳返回广州,停留至10月17日。",
      },
      beijing: {
        name: "北京",
        date: "10月17-21日",
        tag: "长城",
        description: "10月17日从广州乘飞机抵达,停留至10月21日。",
      },
      nanjing: {
        name: "南京",
        date: "10月21-24日",
        tag: "明城墙",
        description: "10月21日从北京乘火车出发,停留至10月24日。",
      },
      yangzhou: {
        name: "扬州",
        date: "10月24-27日",
        tag: "家人 ❤️",
        description: "10月24日至27日在扬州停留。",
      },
      shanghai: {
        name: "上海",
        date: "10月27-30日",
        tag: "外滩",
        description: "10月27日抵达,停留至10月30日,之后乘飞机返回广州。",
      },
      "guangzhou-retorno": {
        name: "广州",
        date: "10月30日",
        tag: "返程",
        description: "10月30日乘飞机从上海返回广州。",
      },
      "istambul-retorno": {
        name: "伊斯坦布尔",
        date: "10月31日",
        tag: "转机",
        description: "回巴西途中在伊斯坦布尔转机。",
      },
      "saopaulo-retorno": {
        name: "圣保罗",
        date: "10月31日",
        tag: "转机",
        description: "经伊斯坦布尔转机后,10月31日抵达圣保罗。",
      },
      "curitiba-retorno": {
        name: "库里蒂巴",
        date: "11月1日",
        tag: "返程",
        description: "11月1日抵达库里蒂巴,行程结束。",
      },
    },
  },
};

export { TRANSLATIONS };
