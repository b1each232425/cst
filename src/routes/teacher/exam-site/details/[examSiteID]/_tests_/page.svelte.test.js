import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';

// mock goto before importing the component so component uses the mocked function
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
import { goto } from '$app/navigation';
import Page from '../+page.svelte';

// Helper to set the pathname so the component picks up the examSiteID
function setPathnameWithId(id = '123') {
	// use history API to change pathname in a jsdom-friendly way
	window.history.pushState({}, '', `/teacher/exam-site/details/${id}`);
}

describe('fetchExamRoomsAndSiteName via +page.svelte', () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		// restore original fetch
		global.fetch = originalFetch;
		// clear goto mock calls if present
		if (goto && typeof goto.mockClear === 'function') goto.mockClear();
			// clear localStorage between tests
			if (typeof localStorage !== 'undefined' && localStorage.clear) localStorage.clear();
		vi.restoreAllMocks();
	});

	it('renders site name and exam room when APIs return success', async () => {
		setPathnameWithId('site-1');

		const mockSiteResp = { status: 0, data: { name: 'Test Site' } };

			const mockRoomResp = {
				status: 0,
				data: [
					{
						id: 18,
						examSiteID: 35,
						name: '考场1',
						capacity: 100,
						available: null,
						recentExam: {},
						// keep exam_room_id for component compatibility
						exam_room_id: 18,
					},
				],
				rowCount: 1,
			};

		global.fetch = vi.fn(async (url) => {
			if (String(url).includes('/api/exam-site/list')) {
				return { ok: true, json: async () => mockSiteResp };
			}
			if (String(url).includes('/api/exam-room/list')) {
				return { ok: true, json: async () => mockRoomResp };
			}
			return { ok: false, status: 404, json: async () => ({}) };
		});

		render(Page);

		// wait for site name to appear
		await screen.findByText('Test Site');

		// expect room details rendered using sample data (use regex/async to avoid split-node issues)
		await screen.findByText(/考场1/);
		await screen.findByText(/100\s*人/);
	});

	it('shows 加载失败 and no-data when site fetch fails and no rooms', async () => {
		setPathnameWithId('site-2');

		const mockSiteFail = { status: 1, msg: 'error' };
		const mockRoomEmpty = { status: 0, data: null, rowCount: 0 };

		global.fetch = vi.fn(async (url) => {
			if (String(url).includes('/api/exam-site/list')) {
				return { ok: true, json: async () => mockSiteFail };
			}
			if (String(url).includes('/api/exam-room/list')) {
				return { ok: true, json: async () => mockRoomEmpty };
			}
			return { ok: false, status: 404, json: async () => ({}) };
		});

		render(Page);

		await screen.findByText('加载失败');
		// no-data cell
		await screen.findByText('暂无数据');
	});

	it('clicking 进入当前监考 sets localStorage and navigates to invigilation', async () => {
		setPathnameWithId('site-invig');

		const mockSiteResp = { status: 0, data: { name: 'Invig Site' } };
		const mockRoomResp = {
			status: 0,
			data: [
				{
					id: 18,
					examSiteID: 35,
					name: '考场1',
					capacity: 100,
					available: null,
					recentExam: {},
					recent_exam_session: [ { exam_session_id: 999 } ],
					exam_room_id: 18,
				},
			],
			rowCount: 1,
		};

		global.fetch = vi.fn(async (url) => {
			if (String(url).includes('/api/exam-site/list')) return { ok: true, json: async () => mockSiteResp };
			if (String(url).includes('/api/exam-room/list')) return { ok: true, json: async () => mockRoomResp };
			return { ok: false, status: 404, json: async () => ({}) };
		});

		render(Page);

		// wait for the 进入当前监考 button
		const btn = await screen.findByText('进入当前监考');
		await fireEvent.click(btn);

		// localStorage should have invigilation_session_info
		const stored = JSON.parse(localStorage.getItem('invigilation_session_info'));
		expect(stored).toBeTruthy();
		expect(stored.exam_session_id).toBe(999);
		expect(stored.exam_room_id).toBe(18);
		expect(stored.is_admin).toBe(true);

		expect(goto).toHaveBeenCalledWith('/teacher/invigilationList/invigilation');
	});

	it('calls goto with room path when clicking 查看所有考试', async () => {
		setPathnameWithId('site-3');

		const mockSiteResp = { status: 0, data: { name: 'Site 3' } };
			const mockRoomResp = {
				status: 0,
				data: [
					{
						id: 18,
						examSiteID: 35,
						name: '考场1',
						capacity: 100,
						available: null,
						recentExam: {},
						exam_room_id: 18,
					},
				],
				rowCount: 1,
			};

		global.fetch = vi.fn(async (url) => {
			if (String(url).includes('/api/exam-site/list')) {
				return { ok: true, json: async () => mockSiteResp };
			}
			if (String(url).includes('/api/exam-room/list')) {
				return { ok: true, json: async () => mockRoomResp };
			}
			return { ok: false, status: 404, json: async () => ({}) };
		});

		render(Page);

		// wait for button to appear
		const btn = await screen.findByText('查看所有考试');
		await fireEvent.click(btn);

		expect(goto).toHaveBeenCalledWith('/teacher/examSiteManagement/room/18');
	});

		it('handlePageSelect triggers fetch with correct page', async () => {
			setPathnameWithId('site-4');

			const mockSiteResp = { status: 0, data: { name: 'Site 4' } };
			const mockRoomResp = {
				status: 0,
				data: [
					{
						id: 18,
						examSiteID: 35,
						name: '考场1',
						capacity: 100,
						available: null,
						recentExam: {},
						exam_room_id: 18,
					},
				],
				rowCount: 1,
			};

			const fetchMock = vi.fn(async (url) => {
				if (String(url).includes('/api/exam-site/list')) {
					return { ok: true, json: async () => mockSiteResp };
				}
				if (String(url).includes('/api/exam-room/list')) {
					return { ok: true, json: async () => mockRoomResp };
				}
				return { ok: false, status: 404, json: async () => ({}) };
			});

			global.fetch = fetchMock;

			render(Page);

			// wait for pagination to render
			const wrapper = await screen.findByTestId('pagination');
			// Pagination component root is usually the first child of the wrapper
			const paginationNode = wrapper.firstElementChild || wrapper;

			// call test hook directly to ensure handler runs
			window.__TEST__.handlePageSelect(3);

			// next fetch should include page=3 in q
			await waitFor(() => {
				const called = fetchMock.mock.calls.find(c => String(c[0]).includes('/api/exam-room/list'));
				expect(called).toBeTruthy();
				const url = called[0];
				const match = /q=([^&]+)/.exec(url);
				expect(match).toBeTruthy();
				const q = JSON.parse(decodeURIComponent(match[1]));
				expect(q.page).toBe(3);
			});
		});

		it('handlePageSizeChange triggers fetch with correct pageSize and resets to page 1', async () => {
			setPathnameWithId('site-5');

			const mockSiteResp = { status: 0, data: { name: 'Site 5' } };
			const mockRoomResp = {
				status: 0,
				data: [
					{
						id: 18,
						examSiteID: 35,
						name: '考场1',
						capacity: 100,
						available: null,
						recentExam: {},
						exam_room_id: 18,
					},
				],
				rowCount: 1,
			};

			const fetchMock = vi.fn(async (url) => {
				if (String(url).includes('/api/exam-site/list')) {
					return { ok: true, json: async () => mockSiteResp };
				}
				if (String(url).includes('/api/exam-room/list')) {
					return { ok: true, json: async () => mockRoomResp };
				}
				return { ok: false, status: 404, json: async () => ({}) };
			});

			global.fetch = fetchMock;

			render(Page);

			const wrapper = await screen.findByTestId('pagination');
			const paginationNode = wrapper.firstElementChild || wrapper;

			// call test hook directly to ensure handler runs
			window.__TEST__.handlePageSizeChange(50);

				// verify next fetch includes pageSize=50 and page reset to 1
				await waitFor(() => {
					const called = fetchMock.mock.calls.find(c => String(c[0]).includes('/api/exam-room/list'));
					expect(called).toBeTruthy();
					const url = called[0];
					const match = /q=([^&]+)/.exec(url);
					expect(match).toBeTruthy();
					const q = JSON.parse(decodeURIComponent(match[1]));
					expect(q.pageSize).toBe(50);
					expect(q.page).toBe(1);
				});
		});

				it('site fetch returns ok:false triggers siteName 加载失败 and still fetches rooms', async () => {
					setPathnameWithId('site-6');

					const mockRoomResp = {
						status: 0,
						data: [
							{ id: 18, examSiteID: 35, name: '考场1', capacity: 100, available: null, recentExam: {}, exam_room_id: 18 }
						],
						rowCount: 1,
					};

					global.fetch = vi.fn(async (url) => {
						if (String(url).includes('/api/exam-site/list')) {
							return { ok: false, status: 500, json: async () => ({}) };
						}
						if (String(url).includes('/api/exam-room/list')) {
							return { ok: true, json: async () => mockRoomResp };
						}
						return { ok: false, status: 404, json: async () => ({}) };
					});

					render(Page);

					// siteName should be set to 加载失败
					await screen.findByText('加载失败');
					// room still fetched and rendered
					await screen.findByText(/考场1/);
				});

				it('site json status !== 0 sets siteName 加载失败 and still fetches rooms', async () => {
					setPathnameWithId('site-7');

					const mockSiteResp = { status: 1, msg: 'bad' };
					const mockRoomResp = {
						status: 0,
						data: [ { id: 18, examSiteID: 35, name: '考场1', capacity: 100, available: null, recentExam: {}, exam_room_id: 18 } ],
						rowCount: 1,
					};

					global.fetch = vi.fn(async (url) => {
						if (String(url).includes('/api/exam-site/list')) return { ok: true, json: async () => mockSiteResp };
						if (String(url).includes('/api/exam-room/list')) return { ok: true, json: async () => mockRoomResp };
						return { ok: false, status: 404, json: async () => ({}) };
					});

					render(Page);

					await screen.findByText('加载失败');
					await screen.findByText(/考场1/);
				});

				it('site json has no name sets siteName 为 无数据', async () => {
					setPathnameWithId('site-8');

					const mockSiteResp = { status: 0, data: {} };
					const mockRoomResp = { status: 0, data: [], rowCount: 0 };

					global.fetch = vi.fn(async (url) => {
						if (String(url).includes('/api/exam-site/list')) return { ok: true, json: async () => mockSiteResp };
						if (String(url).includes('/api/exam-room/list')) return { ok: true, json: async () => mockRoomResp };
						return { ok: false, status: 404, json: async () => ({}) };
					});

					render(Page);

					await screen.findByText('无数据');
					await screen.findByText('暂无数据');
				});

				it('room fetch returns ok:false leads to error and no data displayed', async () => {
					setPathnameWithId('site-9');

					const mockSiteResp = { status: 0, data: { name: 'Site 9' } };

					global.fetch = vi.fn(async (url) => {
						if (String(url).includes('/api/exam-site/list')) return { ok: true, json: async () => mockSiteResp };
						if (String(url).includes('/api/exam-room/list')) return { ok: false, status: 500, json: async () => ({}) };
						return { ok: false, status: 404, json: async () => ({}) };
					});

					render(Page);

					// site loaded
					await screen.findByText('Site 9');
					// room fetch failed -> no-data
					await screen.findByText('暂无数据');
				});

				it('room json status !==0 logs error and shows no data', async () => {
					setPathnameWithId('site-10');

					const mockSiteResp = { status: 0, data: { name: 'Site 10' } };
					const mockRoomResp = { status: 1, msg: 'err' };

					global.fetch = vi.fn(async (url) => {
						if (String(url).includes('/api/exam-site/list')) return { ok: true, json: async () => mockSiteResp };
						if (String(url).includes('/api/exam-room/list')) return { ok: true, json: async () => mockRoomResp };
						return { ok: false, status: 404, json: async () => ({}) };
					});

					render(Page);

					await screen.findByText('Site 10');
					await screen.findByText('暂无数据');
				});

					it('typing in search input triggers fetch with filter.name', async () => {
						setPathnameWithId('site-input');

						const mockSiteResp = { status: 0, data: { name: 'Site Input' } };
						const mockRoomResp = { status: 0, data: [], rowCount: 0 };

						const fetchMock = vi.fn(async (url) => {
							if (String(url).includes('/api/exam-site/list')) return { ok: true, json: async () => mockSiteResp };
							if (String(url).includes('/api/exam-room/list')) return { ok: true, json: async () => mockRoomResp };
							return { ok: false, status: 404, json: async () => ({}) };
						});

						global.fetch = fetchMock;

						render(Page);

						const input = await screen.findByPlaceholderText('请输入考场名称');

						// simulate user typing
						await fireEvent.input(input, { target: { value: '输入测试' } });

						await waitFor(() => {
							const called = fetchMock.mock.calls.find(c => String(c[0]).includes('/api/exam-room/list'));
							expect(called).toBeTruthy();
							const url = called[0];
							const match = /q=([^&]+)/.exec(url);
							expect(match).toBeTruthy();
							const q = JSON.parse(decodeURIComponent(match[1]));
							expect(q.filter.name).toBe('输入测试');
						});
					});
});
