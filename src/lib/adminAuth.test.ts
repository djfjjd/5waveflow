import {describe,expect,it} from 'vitest';
import {isAllowedAdminEmail} from '../../functions/_shared/admin-auth';

describe('admin email authorization',()=>{
  it('allows only the configured administrator email',()=>{
    expect(isAllowedAdminEmail('djfjjd@gmail.com')).toBe(true);
    expect(isAllowedAdminEmail(' DJFJJD@GMAIL.COM ')).toBe(true);
    expect(isAllowedAdminEmail('other@gmail.com')).toBe(false);
    expect(isAllowedAdminEmail(undefined)).toBe(false);
  });
});
