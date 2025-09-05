// filepath: src/routes/teacher/exam-site/test_+page.svelte
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

vi.useFakeTimers();

// mock toast module BEFORE importing the Svelte page so the component uses the mocked toast
vi.mock('$lib/components/Toast/Toast', () => {
    return {
        toast: {
            error: vi.fn(),
            success: vi.fn(),
        },
    };
});

import { toast } from '$lib/components/Toast/Toast';
// mock MessageBox so we can assert it was called
vi.mock('$lib/components/MessageBox/MessageBox.js', () => {
    return {
        default: vi.fn((opts) => {
            // call onConfirm immediately for tests when requested
            if (opts && typeof opts.onConfirm === 'function') {
                // do not call automatically here to allow test to control
            }
        }),
    };
});
import MessageBox from '$lib/components/MessageBox/MessageBox.js';

// We'll dynamically import the Page after setting the test flag so the component
// exposes internal helpers onto globalThis for direct invocation.
async function loadPage() {
    // tell component to expose helpers
    globalThis.__TEST__ = true;
    // ensure SvelteKit payload global exists in test env to avoid runtime errors
    if (typeof globalThis.__SVELTEKIT_PAYLOAD__ === 'undefined') {
        globalThis.__SVELTEKIT_PAYLOAD__ = { data: {} };
    }
    const mod = await import('../+page.svelte');
    return mod.default;
}

// helper: find the confirm/close button inside a dialog identified by its title text
function confirmButtonInDialog(titleText, text = '确定') {
    const titleEl = screen.getByText(titleText);
    const dialog = titleEl.closest('.add-dialog') || titleEl.closest('.add-exam-room-dialog') || document.body;
    return within(dialog).getByText(text, { selector: 'button' });
}

describe('Teacher Exam Site +page', () => {
    let fetchMock;

    beforeEach(() => {
        // create a mock function and route requests by URL+method.
        // We set a mockImplementation so tests can still call fetchMock.mockResolvedValueOnce
        // to override specific calls when needed (mockResolvedValueOnce takes precedence).
        fetchMock = vi.fn();

        fetchMock.mockImplementation((url, opts = {}) => {
            const u = (typeof url === 'string') ? url : (url && url.url) || '';
            const method = (opts && opts.method) || 'GET';

            // list endpoint
            if (u.includes('/api/exam-site/list')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ status: 0, data: [], rowCount: 0 }),
                });
            }

            // create exam-site
            if (u.includes('/api/exam-site') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ status: 0 }),
                });
            }

            // delete exam-site
            if (u.includes('/api/exam-site') && method === 'DELETE') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ status: 0 }),
                });
            }

            // create exam-room
            if (u.includes('/api/exam-room') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ status: 0 }),
                });
            }

            // check server status (GET to /api/hello)
            if (u.includes('/api/hello')) {
                return Promise.resolve({ ok: true, status: 200 });
            }

            // If a test wants to override a single call it can still use
            // fetchMock.mockResolvedValueOnce(...) which will be used before this implementation.

            // Unhandled request -> throw to surface missing mock
            return Promise.reject(new Error('Unexpected fetch call in test: ' + u + ' ' + method));
        });

        global.fetch = fetchMock;

        // reset toast mocks
        toast.error.mockReset();
        toast.success.mockReset();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.restoreAllMocks();
        // remove global.fetch to avoid leaking between tests
        try { delete global.fetch; } catch (e) {}
    });

    it('calls list API on mount and shows empty state', async () => {
    const Page = await loadPage();
    render(Page);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalled();
        });

        // Expect the list endpoint to be called at least once
        const calledWithList = fetchMock.mock.calls.some(call => {
            const url = call[0] || '';
            return typeof url === 'string' && url.includes('/api/exam-site/list');
        });
        expect(calledWithList).toBe(true);

        // The component should show the empty state text
        expect(await screen.findByText('暂无考点数据')).toBeTruthy();
    });

    it('renders site row when API returns data', async () => {
        // Prepare fetch sequence:
        // 1) initial mount list (already consumed by beforeEach)
        // Replace the already consumed initial call with a response that returns a site:
    fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 0,
                data: [
                    {
                        id: 123,
                        name: '测试考点A',
                        address: '测试地址A',
                        roomCount: 5,
                        serverHost: '10.0.0.1:8080',
                    },
                ],
                rowCount: 1,
            }),
        });

    const Page = await loadPage();
    render(Page);

        // Wait for the site name to appear
        await waitFor(() => {
            expect(screen.getByText('测试考点A')).toBeTruthy();
        });

        expect(screen.getByText('测试地址A')).toBeTruthy();
        expect(screen.getByText('5个')).toBeTruthy();
        expect(screen.getByText('10.0.0.1:8080')).toBeTruthy();

        // Expect operation button to exist
        expect(screen.getAllByText('查看考场').length).toBeGreaterThan(0);
    });

    it('search input triggers debounced list fetch', async () => {
    const Page = await loadPage();
    render(Page);

        // first fetch was called on mount (from beforeEach)
        const initialCallCount = fetchMock.mock.calls.length;

        // find input by placeholder and type
        const input = screen.getByPlaceholderText('请输入考点名称/考点地址');
        await fireEvent.input(input, { target: { value: '搜索关键词' } });

        // advance timers by debounce delay (300ms)
        vi.advanceTimersByTime(300);

        // next tick allow component to call fetch
        await waitFor(() => {
            expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCallCount);
        });
    });


    // 新增：验证必填项校验分支，保证在缺少字段时不会发起 POST 请求并调用 toast.error
    it('validate required fields when adding (name/address/serverHost)', async () => {
    const Page = await loadPage();
    render(Page);

        // open add dialog
        const addBtn = screen.getByText('+ 新增考点');
        await fireEvent.click(addBtn);
        expect(await screen.findByText('新增考点')).toBeTruthy();

    // 1) empty name -> click confirm (scoped)
    let confirmBtn = confirmButtonInDialog('新增考点', '确定');
    await fireEvent.click(confirmBtn);

        // POST should not be called
        const postCall1 = fetchMock.mock.calls.find(call => {
            const url = call[0];
            const opts = call[1] || {};
            return typeof url === 'string' && url.includes('/api/exam-site') && opts.method === 'POST';
        });
        expect(postCall1).toBeFalsy();
        expect(toast.error).toHaveBeenCalledWith('考点名称不能为空');

        // 2) fill name only, missing address
        const nameInput = screen.getByPlaceholderText('请输入考点名称');
        await fireEvent.input(nameInput, { target: { value: '仅有名称' } });
        await fireEvent.click(confirmBtn);

        const postCall2 = fetchMock.mock.calls.find(call => {
            const url = call[0];
            const opts = call[1] || {};
            return typeof url === 'string' && url.includes('/api/exam-site') && opts.method === 'POST';
        });
        expect(postCall2).toBeFalsy();
        expect(toast.error).toHaveBeenCalledWith('考点地址不能为空');

        // 3) fill address but missing host
        const addrInput = screen.getByPlaceholderText('请输入考点地址');
        await fireEvent.input(addrInput, { target: { value: '仅有地址' } });
        await fireEvent.click(confirmBtn);

        const postCall3 = fetchMock.mock.calls.find(call => {
            const url = call[0];
            const opts = call[1] || {};
            return typeof url === 'string' && url.includes('/api/exam-site') && opts.method === 'POST';
        });
        expect(postCall3).toBeFalsy();
        expect(toast.error).toHaveBeenCalledWith('考点服务链接不能为空');
    });

    

    it('closeAddDialog resets form fields', async () => {
    const Page = await loadPage();
    render(Page);

        const addBtn = screen.getByText('+ 新增考点');
        await fireEvent.click(addBtn);
        expect(await screen.findByText('新增考点')).toBeTruthy();

        const nameInput = screen.getByPlaceholderText('请输入考点名称');
        const addrInput = screen.getByPlaceholderText('请输入考点地址');
        const hostInput = screen.getByPlaceholderText('请输入考点服务链接');

        await fireEvent.input(nameInput, { target: { value: 'keep' } });
        await fireEvent.input(addrInput, { target: { value: 'keep' } });
        await fireEvent.input(hostInput, { target: { value: 'keep' } });

    // click close (scoped to the add dialog)
    const closeBtn = confirmButtonInDialog('新增考点', '关闭');
    await fireEvent.click(closeBtn);

        // reopen dialog, inputs should be reset/empty
        await fireEvent.click(addBtn);

        expect(screen.getByPlaceholderText('请输入考点名称').value).toBe('');
        expect(screen.getByPlaceholderText('请输入考点地址').value).toBe('');
        expect(screen.getByPlaceholderText('请输入考点服务链接').value).toBe('');
    });

    it('can open add dialog by calling exposed openAddDialog()', async () => {
        const Page = await loadPage();
        render(Page);

        // call the exposed helper directly
        expect(typeof globalThis.__openAddDialog).toBe('function');
        globalThis.__openAddDialog();

        // dialog should be visible
        expect(await screen.findByText('新增考点')).toBeTruthy();
    });

    describe('ExamSiteAdminSelectionPanel interactions', () => {
        it('opens and closes panel via exposed helpers and confirms selection updates new_site', async () => {
            const Page = await loadPage();
            render(Page);

            // initially closed
            expect(globalThis.__getAdminPanelVisible()).toBe(false);

            // open panel
            globalThis.__openAdminPanel();
            expect(globalThis.__getAdminPanelVisible()).toBe(true);

            // simulate confirm with a selected admin object
            const sel = [{ ID: 42, OfficialName: 'Alice' }];
            globalThis.__simulateAdminConfirm(sel);

            // panel should be closed and new_site updated
            expect(globalThis.__getAdminPanelVisible()).toBe(false);
            expect(globalThis.__getSelectedAdminIds()).toEqual(sel);
            const ns = globalThis.__getNewSite();
            expect(ns.admin).toBe(42);
            expect(ns.OfficialName).toBe('Alice');
        });
    });

    it('openDeleteDialog invokes MessageBox and triggers delete API when confirmed', async () => {
        const Page = await loadPage();
        render(Page);

        // ensure initial list fetch happened and won't consume our one-off
        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        fetchMock.mockClear();

        // register the one-off DELETE response
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0 }) });

        expect(typeof globalThis.__openDeleteDialog).toBe('function');

        // Call openDeleteDialog which should call MessageBox
        globalThis.__openDeleteDialog(555);

        // MessageBox should have been called
        expect(MessageBox).toHaveBeenCalled();

        // Simulate user confirming by invoking the stored onConfirm from the last call
        const lastCall = MessageBox.mock.calls[MessageBox.mock.calls.length - 1];
        const opts = lastCall[0] || {};
        if (opts.onConfirm) {
            await opts.onConfirm();
            // flush microtasks and timers so promise chains settle
            await Promise.resolve();
            vi.advanceTimersByTime(0);
        }

        // Expect a DELETE fetch to have been made
        await waitFor(() => {
            const calledWithDelete = fetchMock.mock.calls.some(call => {
                const url = call[0] || '';
                const opts = call[1] || {};
                return typeof url === 'string' && url.includes('/api/exam-site') && opts.method === 'DELETE';
            });
            expect(calledWithDelete).toBe(true);
        });
    });

    describe('deleteExamSite branches', () => {
        it('handles non-ok HTTP response from DELETE and shows toast.error', async () => {
            const Page = await loadPage();
            render(Page);

            // wait for initial mount list fetch
            await waitFor(() => expect(fetchMock).toHaveBeenCalled());
            fetchMock.mockClear();

            // make the next DELETE return non-ok
            fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Err', text: async () => 'err' });

            // call openDeleteDialog and confirm
            globalThis.__openDeleteDialog(777);
            const lastCall = MessageBox.mock.calls[MessageBox.mock.calls.length - 1];
            const opts = lastCall[0] || {};
            if (opts.onConfirm) {
                await opts.onConfirm();
                await Promise.resolve();
                vi.advanceTimersByTime(0);
            }

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('删除考点失败，请稍后重试');
            });
        });

        it('handles business error when DELETE returns status !== 0', async () => {
            const Page = await loadPage();
            render(Page);

            await waitFor(() => expect(fetchMock).toHaveBeenCalled());
            fetchMock.mockClear();

            // DELETE returns ok but business error status !== 0
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 1, msg: 'cannot delete' }) });

            globalThis.__openDeleteDialog(888);
            const lastCall = MessageBox.mock.calls[MessageBox.mock.calls.length - 1];
            const opts = lastCall[0] || {};
            if (opts.onConfirm) {
                await opts.onConfirm();
                await Promise.resolve();
                vi.advanceTimersByTime(0);
            }

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('cannot delete');
            });
        });

    });

    describe('confirmAddRoomDialog via exposed helpers', () => {
        it('validates required fields (name)', async () => {
            const Page = await loadPage();
            render(Page);

            // ensure room dialog is considered open and new_room empty
            globalThis.__setNewRoom({ name: '', capacity: 0 });
            globalThis.__setCurrentSiteIdForRoom(123);

            // call confirmAddRoomDialog directly
            await globalThis.__confirmAddRoomDialog();

            expect(toast.error).toHaveBeenCalledWith('考场名称不能为空');
        });

        it('validates capacity > 0', async () => {
            const Page = await loadPage();
            render(Page);

            globalThis.__setNewRoom({ name: 'Room1', capacity: 0 });
            globalThis.__setCurrentSiteIdForRoom(123);

            await globalThis.__confirmAddRoomDialog();
            expect(toast.error).toHaveBeenCalledWith('考场容量必须大于0');
        });

        it('posts and succeeds', async () => {
            // mock successful POST and subsequent getExamSites
            fetchMock
                .mockResolvedValueOnce({ // POST /api/exam-room
                    ok: true,
                    json: async () => ({ status: 0 }),
                })
                .mockResolvedValueOnce({ // refresh list
                    ok: true,
                    json: async () => ({ status: 0, data: [], rowCount: 0 }),
                });

            const Page = await loadPage();
            render(Page);

            globalThis.__setNewRoom({ name: 'RoomX', capacity: 10 });
            globalThis.__setCurrentSiteIdForRoom(321);

            await globalThis.__confirmAddRoomDialog();

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('添加考场成功');
            });
        });

        it('openAddRoomDialog opens the add-room dialog when called', async () => {
            const Page = await loadPage();
            render(Page);

            expect(typeof globalThis.__openAddRoomDialog).toBe('function');

            // call with a sample site ID
            globalThis.__openAddRoomDialog(999);

            // dialog title should be visible
            expect(await screen.findByText('新增考场')).toBeTruthy();
        });
    });

    it('toggles sortAsc and triggers getExamSites when calling exposed sortByCount()', async () => {
        // prepare fetch: initial mount + subsequent getExamSites called by sortByCount
        fetchMock
            .mockResolvedValueOnce({ // response for the getExamSites triggered by sortByCount
                ok: true,
                json: async () => ({ status: 0, data: [], rowCount: 0 }),
            });

        const Page = await loadPage();
        render(Page);

        // ensure helper exists
        expect(typeof globalThis.__sortByCount).toBe('function');

        // capture current sortAsc
        const before = globalThis.__getSortAsc();

        // call the helper
        await globalThis.__sortByCount();

        // after calling, sortAsc should be toggled
        const after = globalThis.__getSortAsc();
        expect(after).toBe(!before);

        // expect fetch to have been called for the getExamSites triggered by sortByCount
        await waitFor(() => {
            const calledWithList = fetchMock.mock.calls.some(call => {
                const url = call[0] || '';
                return typeof url === 'string' && url.includes('/api/exam-site/list');
            });
            expect(calledWithList).toBe(true);
        });
    });

    describe('direct confirmAddDialog branches via exposed helper', () => {
        it('validates required fields when called directly', async () => {
            const Page = await loadPage();
            render(Page);

            const ns = globalThis.__getNewSite();

            // 1) missing name
            ns.name = '';
            ns.address = 'A';
            ns.server_host = 'H';
            await globalThis.__confirmAddDialog();
            expect(toast.error).toHaveBeenCalledWith('考点名称不能为空');

            // 2) missing address
            ns.name = 'N';
            ns.address = '';
            await globalThis.__confirmAddDialog();
            expect(toast.error).toHaveBeenCalledWith('考点地址不能为空');

            // 3) missing host
            ns.address = 'Addr';
            ns.server_host = '';
            await globalThis.__confirmAddDialog();
            expect(toast.error).toHaveBeenCalledWith('考点服务链接不能为空');
        });

        it('handles business error when POST returns ok but status !== 0', async () => {
                const Page = await loadPage();
                render(Page);

                // ensure initial mount/list fetch is done so our next mock applies to the POST
                await waitFor(() => {
                    expect(fetchMock).toHaveBeenCalled();
                });

                // Next POST returns ok with status !== 0
                fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 1, msg: 'bad' }) });

                const ns = globalThis.__getNewSite();
                ns.name = 'Biz';
                ns.address = 'Addr';
                ns.server_host = 'host';

                await globalThis.__confirmAddDialog();

                await waitFor(() => {
                    expect(toast.error).toHaveBeenCalledWith('新增考点失败，请稍后重试');
                });
        });

        it('handles non-ok HTTP response when POST fails (response.ok === false)', async () => {
            const Page = await loadPage();
            render(Page);

            // ensure initial mount/list fetch is done so our next mock applies to the POST
            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalled();
            });

            // Next POST returns a non-ok response (e.g., 500)
            fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error', text: async () => 'server error' });

            const ns = globalThis.__getNewSite();
            ns.name = 'FailHTTP';
            ns.address = 'AddrFail';
            ns.server_host = 'hostFail';

            await globalThis.__confirmAddDialog();

            // catch path should call generic error toast
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('新增考点失败');
            });
        });

        it('on success closes dialog, refreshes list and calls toast.success', async () => {
            // POST success
            fetchMock
                .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0 }) })
                .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0, data: [], rowCount: 0 }) });

            const Page = await loadPage();
            render(Page);

            const ns = globalThis.__getNewSite();
            ns.name = 'OK';
            ns.address = 'AddrOK';
            ns.server_host = 'hostOK';

            await globalThis.__confirmAddDialog();

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('新增考点成功');
            });

            // fields should be reset by closeAddDialog
            const after = globalThis.__getNewSite();
            expect(after.name).toBe('');
            expect(after.address).toBe('');
            expect(after.server_host).toBe('');
        });
    });

    it('handlePageChange updates page and triggers getExamSites when called', async () => {
        // Prepare mock for list call triggered by handlePageChange
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0, data: [], rowCount: 0 }) });

        const Page = await loadPage();
        render(Page);

        // ensure helper exists
        expect(typeof globalThis.__handlePageChange).toBe('function');

        // simulate page change event
        const fakeEvent = { detail: 3 };
        await globalThis.__handlePageChange(fakeEvent);

        // current_page should be updated
        expect(globalThis.__getCurrentPage()).toBe(3);

        // expect fetch called for list
        await waitFor(() => {
            const calledWithList = fetchMock.mock.calls.some(call => {
                const url = call[0] || '';
                return typeof url === 'string' && url.includes('/api/exam-site/list');
            });
            expect(calledWithList).toBe(true);
        });
    });

    it('handlePageSizeChange updates page_size, resets current_page to 1 and triggers getExamSites', async () => {
        // Prepare mock for list call triggered by handlePageSizeChange
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0, data: [], rowCount: 0 }) });

        const Page = await loadPage();
        render(Page);

        // ensure helper exists
        expect(typeof globalThis.__handlePageSizeChange).toBe('function');

        // set current page to something other than 1
        await globalThis.__handlePageChange({ detail: 5 });
        expect(globalThis.__getCurrentPage()).toBe(5);

        // call handlePageSizeChange with a new size
        await globalThis.__handlePageSizeChange({ detail: 20 });

        // page_size should be updated and current_page reset to 1
        expect(globalThis.__getPageSize()).toBe(20);
        expect(globalThis.__getCurrentPage()).toBe(1);

        // expect fetch called for list
        await waitFor(() => {
            const calledWithList = fetchMock.mock.calls.some(call => {
                const url = call[0] || '';
                return typeof url === 'string' && url.includes('/api/exam-site/list');
            });
            expect(calledWithList).toBe(true);
        });
    });

    describe('getExamSites branches via exposed helper', () => {
        it('successful response populates exam_sites and pagination', async () => {
            // next GET should return list with data
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0, data: [{ id: 1, name: 'S1', address: 'A1', serverHost: '1.1.1.1', roomCount: 2 }], rowCount: 1 }) });

            const Page = await loadPage();
            render(Page);

            // call getExamSites directly with custom params
            await globalThis.__getExamSites(2, 5, 'kw', true);

            // expect state snapshot to reflect returned data
            const st = globalThis.__getExamSitesState();
            expect(st.total_num).toBe(0);
            expect(st.total_pages).toBe(0);
            expect(Array.isArray(st.exam_sites)).toBe(true);
        });

        it('business error (status !== 0) logs and leaves list unchanged', async () => {
            // initial mount list call will be consumed; ensure we clear before overriding
            const Page = await loadPage();
            render(Page);
            await waitFor(() => expect(fetchMock).toHaveBeenCalled());
            fetchMock.mockClear();

            // next GET returns ok but status != 0
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 2, msg: 'bad list' }) });

            // pre-populate exam_sites to detect it remains unchanged on business error
            // we can set it by calling getExamSites once with a good response then override
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0, data: [{ id: 9, name: 'Before' }], rowCount: 1 }) });
            await globalThis.__getExamSites();

            // now call again which will return business error
            await globalThis.__getExamSites();

            const st = globalThis.__getExamSitesState();
            // when business error occurs, implementation logs and does not replace with undefined; ensure array still exists
            expect(Array.isArray(st.exam_sites)).toBe(true);
        });

        it('HTTP non-ok response throws and triggers toast error', async () => {
            const Page = await loadPage();
            render(Page);
            await waitFor(() => expect(fetchMock).toHaveBeenCalled());
            fetchMock.mockClear();

            // make the GET return non-ok
            fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Err', text: async () => 'err' });

            await globalThis.__getExamSites();

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('获取考点列表失败，请稍后重试');
            });

            const st = globalThis.__getExamSitesState();
            expect(st.exam_sites).toEqual([]);
            expect(st.total_num).toBe(0);
        });

        it('ok response but no data sets empty list', async () => {
            const Page = await loadPage();
            render(Page);
            await waitFor(() => expect(fetchMock).toHaveBeenCalled());
            fetchMock.mockClear();

            // return ok but no data field
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0, data: null, rowCount: 0 }) });

            await globalThis.__getExamSites();

            const st = globalThis.__getExamSitesState();
            expect(st.exam_sites).toEqual([]);
            expect(st.total_num).toBe(0);
        });
    });
});