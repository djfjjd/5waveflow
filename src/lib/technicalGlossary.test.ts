import {describe,expect,it} from 'vitest';
import {TECHNICAL_GLOSSARY,WYCKOFF_EVENT_IDS} from './technicalGlossary';

describe('technical analysis glossary',()=>{
  it('documents every Wyckoff event emitted by the engine',()=>expect(Object.keys(WYCKOFF_EVENT_IDS).sort()).toEqual(['AR','BC','LPS','LPSY','SC','SOS','SOW','ST','Spring','Upthrust'].sort()));
  it('uses unique anchors for stable result links',()=>{const ids=TECHNICAL_GLOSSARY.map(item=>item.id);expect(new Set(ids).size).toBe(ids.length)});
  it('contains explanations for every linked Wyckoff anchor',()=>{const ids=new Set(TECHNICAL_GLOSSARY.map(item=>item.id));expect(Object.values(WYCKOFF_EVENT_IDS).every(id=>ids.has(id))).toBe(true)});
});
