import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources={
  ko:{translation:{markets:'마켓',analysis:'분석',history:'기록',pricing:'요금제',wallpaper:'배경화면',technicalNav:'기술적분석',login:'로그인',today:'오늘',marketDirection:'시장 방향',bullish:'상승',bearish:'하락',probability:'확률 분석',technical:'기술적 분석',updated:'갱신',preparing:'검증 모델 준비 중',noFake:'검증된 모델이 없어 확률을 표시하지 않습니다.',stocksSoon:'주식 데이터 공급자 연결 준비 중'}},
  en:{translation:{markets:'Markets',analysis:'Analysis',history:'History',pricing:'Pricing',wallpaper:'Wallpaper',technicalNav:'Technical',login:'Login',today:'Today',marketDirection:'Market direction',bullish:'Bullish',bearish:'Bearish',probability:'Probability',technical:'Technical Analysis',updated:'Updated',preparing:'Validated model pending',noFake:'No probabilities are shown until a model is validated.',stocksSoon:'Stock data provider coming soon'}}
};

i18n.use(LanguageDetector).use(initReactI18next).init({resources,fallbackLng:'ko',supportedLngs:['ko','en'],detection:{order:['localStorage','navigator'],caches:['localStorage']},interpolation:{escapeValue:false}});
export default i18n;
