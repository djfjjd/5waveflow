import {describe,expect,it} from 'vitest';
import {appleShortcutShareUrl} from './shortcut';

describe('Apple shortcut share URL',()=>{
  it('accepts an Apple iCloud shortcut link',()=>expect(appleShortcutShareUrl('https://www.icloud.com/shortcuts/AbC_123')).toBe('https://www.icloud.com/shortcuts/AbC_123'));
  it('rejects non-Apple and malformed links',()=>{expect(appleShortcutShareUrl('https://example.com/shortcuts/abc')).toBeNull();expect(appleShortcutShareUrl('shortcuts://create-shortcut')).toBeNull()});
});
