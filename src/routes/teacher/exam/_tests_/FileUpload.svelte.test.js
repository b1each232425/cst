import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { fileStore, clearSelectedFiles, queryFiles, fastdigest,singles,tusInit,encodeMetadata } from '../_stores/FileUpload.svelte';
import { waitFor } from '@testing-library/svelte';
import { createXXHash64 } from 'hash-wasm';
import { filesize } from 'filesize';
// Mock dependencies

class MockDataTransfer {
  constructor() {
    this.files = {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {}
    };
  }
}

// 在全局设置 DataTransfer mock
global.DataTransfer = MockDataTransfer;
vi.mock('hash-wasm', () => ({
  createXXHash64: vi.fn(() => Promise.resolve({
    init: vi.fn(),
    update: vi.fn(),
    digest: vi.fn(() => 'computed-hash')
  }))
}));

vi.mock('filesize', () => ({
  filesize: vi.fn((size) => `${size} bytes`)
}));



// 在 describe 外
const tusMocks = []

vi.mock('tus-js-client', () => ({
  Upload: vi.fn().mockImplementation(function (file, opts) {
    const instance = {
      start: vi.fn(() => {
        setTimeout(() => {
          // 默认行为：立即成功
          opts.onSuccess?.({})
        }, 0)
      }),
      _triggerSuccess: (res) => setTimeout(() => opts.onSuccess?.(res), 0),
      _triggerProgress: (u, t) => setTimeout(() => opts.onProgress?.(u, t), 0),
      _triggerError: (e) => setTimeout(() => opts.onError?.(e), 0)
    }
    tusMocks.push(instance)
    return instance
  })
}))

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('FileUpload Store 测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store to initial state
    fileStore.set({
      criteria: '.*',
      fileApi: '/api/file',
      endpoint: '/api/file',
      CHUNKSIZE: 1024 * 1024 * 4,
      chunkSize: 1024 * 1024 * 4,
      parallelUploads: 1,
      jobs: new Map(),
      uploadedFiles: [],
      selectedFiles: null,
    });
    
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('fileStore 初始化测试', () => {
    it('应该具有正确的初始值', () => {
      const storeValue = get(fileStore);
      
      expect(storeValue.criteria).toBe('.*');
      expect(storeValue.fileApi).toBe('/api/file');
      expect(storeValue.endpoint).toBe('/api/file');
      expect(storeValue.CHUNKSIZE).toBe(1024 * 1024 * 4);
      expect(storeValue.chunkSize).toBe(1024 * 1024 * 4);
      expect(storeValue.parallelUploads).toBe(1);
      expect(storeValue.jobs).toBeInstanceOf(Map);
      expect(storeValue.uploadedFiles).toEqual([]);
      expect(storeValue.selectedFiles).toBeNull();
    });

    it('store更新时应该触发订阅', () => {
      fileStore.update(s => ({ ...s, criteria: 'test' }));
      
      expect(console.log).toHaveBeenCalledWith('fileStore updated:', expect.objectContaining({
        criteria: 'test'
      }));
    });
  });

  describe('clearSelectedFiles 函数测试', () => {
    it('应该清空选中的文件', () => {
      // 先设置一些文件
      fileStore.update(s => ({ ...s, selectedFiles: 'some files' }));
      
      // 调用清空函数
      clearSelectedFiles();
      
      const storeValue = get(fileStore);
      expect(storeValue.selectedFiles.length).toBe(0);
    expect(typeof storeValue.selectedFiles.item).toBe('function');
    expect(typeof storeValue.selectedFiles[Symbol.iterator]).toBe('function');
    });

    it('clearSelectedFiles 应该更新store', () => {
  clearSelectedFiles();
  const storeValue = get(fileStore);
  expect(storeValue.selectedFiles.length).toBe(0);
});
  });

  describe('queryFiles 函数测试', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('成功获取文件列表', async () => {
      const mockFiles = [
        {
          ID: 'file1',
          Size: 1024,
          MetaData: {
            filename: 'test1.txt',
            filesize: 1024,
            checksum: 'checksum1'
          }
        },
        {
          ID: 'file2',
          Size: 2048,
          MetaData: {
            filename: 'test2.txt',
            filesize: 2048,
            checksum: 'checksum2'
          }
        }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '100']]),
        json: () => Promise.resolve(mockFiles)
      });

      queryFiles();

      // 验证API调用
      expect(fetch).toHaveBeenCalledWith('/api/file/nonexistence?q=.*');
      await waitFor(() => {
      expect(get(fileStore).uploadedFiles).toHaveLength(2);
  });
      // 验证store更新
      const storeValue = get(fileStore);
      expect(storeValue.uploadedFiles[0]).toEqual({
        url: '/api/file/file1',
        filename: 'test1.txt',
        filesize: 1024,
        checksum: 'checksum1'
      });
    });

    it('处理空文件列表响应', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '0']]),
        json: () => Promise.resolve([])
      });

      await queryFiles();

      expect(console.log).toHaveBeenCalledWith('empty file list');
      
      const storeValue = get(fileStore);
      expect(storeValue.uploadedFiles).toEqual([]);
    });

    it('处理API请求失败', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        headers: new Map([['content-length', '0']])
      });

      await queryFiles();

      const storeValue = get(fileStore);
      expect(storeValue.uploadedFiles).toEqual([]);
    });

    it('处理缺失MetaData的文件', async () => {
      const mockFiles = [
        {
          ID: 'file1',
          Size: 1024,
          MetaData: {}
        }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '100']]),
        json: () => Promise.resolve(mockFiles)
      });

      queryFiles();
      await waitFor(() => {
      expect(get(fileStore).uploadedFiles).toHaveLength(1);
  });

      const storeValue = get(fileStore);
      expect(storeValue.uploadedFiles[0]).toEqual({
        url: '/api/file/file1',
        filename: 'file1',
        filesize: 1024,
        checksum: 'file1'
      });
    });

    // it('处理网络错误', async () => {
    //   global.fetch.mockRejectedValue(new Error('Network error'));

    //   queryFiles();

    //   expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    // });

    // it('使用自定义criteria查询', async () => {
    //   fileStore.update(s => ({ ...s, criteria: '*.pdf' }));

    //   global.fetch.mockResolvedValue({
    //     ok: true,
    //     headers: new Map([['content-length', '0']])
    //   });

    //   await queryFiles();

    //   expect(fetch).toHaveBeenCalledWith('/api/file/nonexistence?q=%2A.pdf');
    // });

    it('使用自定义fileApi端点', async () => {
      fileStore.update(s => ({ ...s, fileApi: '/custom/api' }));

      global.fetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '0']])
      });

      await queryFiles();

      expect(fetch).toHaveBeenCalledWith('/custom/api/nonexistence?q=.*');
    });
  });

  describe('fastdigest 函数测试', () => {
    let mockFileReader;
    let mockHash;

    beforeEach(() => {
      vi.clearAllMocks();
      mockFileReader = {
        onload: null,
        
        readAsArrayBuffer: vi.fn()
      };

      mockHash = {
        init: vi.fn(),
        update: vi.fn(),
        digest: vi.fn(() => 'computed-hash')
      };

      global.FileReader = vi.fn(() => mockFileReader);
      
      // const { createXXHash64 } = require('hash-wasm');
      createXXHash64.mockResolvedValue(mockHash);
    });

    it('成功计算小文件的哈希值', async () => {
      const mockFile = {
        size: 1024,
        slice: vi.fn((start, end) => new ArrayBuffer(end - start))
      };

      const job = { id: 'job1', file: mockFile };

      // 模拟文件读取完成
      setTimeout(() => {
        mockFileReader.onload({
          target: {
            result: new ArrayBuffer(1024)
          }
        });
      }, 0);

      const hashPromise = fastdigest(job);

      await expect(hashPromise).resolves.toBe('computed-hash');
      
      expect(mockHash.init).toHaveBeenCalled();
      expect(mockHash.update).toHaveBeenCalled();
      expect(mockHash.digest).toHaveBeenCalled();
      expect(mockFile.slice).toHaveBeenCalledWith(0, expect.any(Number));
    });

    it('成功计算大文件的哈希值（分块读取）', async () => {
  const CHUNK_SIZE = 1024 * 1024 * 4;
  const mockFile = {
    size: CHUNK_SIZE * 2.5, // 2.5 个块
    slice: vi.fn((start, end) => new ArrayBuffer(Math.min(end - start, CHUNK_SIZE)))
  };

  const job = { id: 'job1', file: mockFile };

  // 模拟 FileReader 的多次读取
  let readCallIndex = 0;
  const totalChunks = 3; // 2.5 向上取整为 3 次

  mockFileReader.readAsArrayBuffer = vi.fn(function () {
    const chunkIndex = readCallIndex++;
    const bufferSize = chunkIndex < 2 ? CHUNK_SIZE : CHUNK_SIZE * 0.5;
    setTimeout(() => {
      this.onload({
        target: {
          result: new ArrayBuffer(bufferSize)
        }
      });
    }, 0);
  });

  const hashPromise = fastdigest(job);

  await expect(hashPromise).resolves.toBe('computed-hash');

  expect(mockFile.slice).toHaveBeenCalledTimes(3);
  expect(mockHash.update).toHaveBeenCalledTimes(3);
});

    it('处理无效job参数', async () => {
      await expect(fastdigest(null)).rejects.toBe('invalid/null job');
      await expect(fastdigest({})).rejects.toBe('invalid/null job');
      await expect(fastdigest({ id: 'test' })).rejects.toBe('invalid/null job');
    });

    it('处理文件读取错误', async () => {
      const mockFile = {
        size: 1024,
        slice: vi.fn(() => new ArrayBuffer(1024))
      };

      const job = { id: 'job1', file: mockFile };

      // 模拟文件读取错误
      setTimeout(() => {
        mockFileReader.onload({
          target: {
            result: null
          }
        });
      }, 0);

      await expect(fastdigest(job)).rejects.toBeInstanceOf(Error);
      
      // 验证job被从store中删除
      const storeValue = get(fileStore);
      expect(storeValue.jobs.has('job1')).toBe(false);
    });

    it('更新进度和性能指标', async () => {
      const mockFile = {
        size: 1024,
        slice: vi.fn(() => new ArrayBuffer(1024))
      };

      const job = { id: 'job1', file: mockFile };

      // 模拟文件读取完成
      setTimeout(() => {
        mockFileReader.onload({
          target: {
            result: new ArrayBuffer(1024)
          }
        });
      }, 10); // 稍微延迟以确保时间计算

      await fastdigest(job);

      expect(job.sumProgress).toBe('100.00');
      expect(job.sumPerformance).toBeGreaterThan(0);
    });

    it('使用自定义CHUNKSIZE', async () => {
  const customChunkSize = 1024 * 512; // 512KB
  fileStore.update(s => ({ ...s, CHUNKSIZE: customChunkSize }));

  const mockFile = {
    size: customChunkSize * 2,
    slice: vi.fn((start, end) => new ArrayBuffer(end - start))
  };

  const job = { id: 'job1', file: mockFile };

  let readCallIndex = 0;
  mockFileReader.readAsArrayBuffer = vi.fn(function () {
    setTimeout(() => {
      this.onload({
        target: {
          result: new ArrayBuffer(customChunkSize)
        }
      });
    }, 0);
  });

  await fastdigest(job);

  // 验证分两次读取
  expect(mockFile.slice).toHaveBeenCalledTimes(2);
  expect(mockFile.slice).toHaveBeenNthCalledWith(1, 0, customChunkSize);
  expect(mockFile.slice).toHaveBeenNthCalledWith(2, customChunkSize, customChunkSize * 2 +1);
});
  });

  describe('singles 函数测试', () => {
  let mockTusUpload;
  let mockJob;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置 store 到初始状态
    fileStore.set({
      criteria: '.*',
      fileApi: '/api/file',
      endpoint: '/api/file',
      CHUNKSIZE: 1024 * 1024 * 4,
      chunkSize: 1024 * 1024 * 4,
      parallelUploads: 1,
      jobs: new Map(),
      uploadedFiles: [],
      selectedFiles: null,
    });

    // 模拟文件对象
    const mockFile = {
      name: 'test-file.txt',
      type: 'text/plain',
      size: 1024,
      lastModified: 1640995200000, // 2022-01-01 00:00:00 GMT
      slice: vi.fn(() => new ArrayBuffer(1024))
    };

    mockJob = {
      id: 'test-job-1',
      file: mockFile
    };

    // 设置 tus-js-client mock
    const { Upload } = require('tus-js-client');
    mockTusUpload = new Upload(mockFile, {});
    
    // 确保全局 tus 对象可用
    global.tus = { Upload };
  });
  
  it('成功完成文件上传流程', async () => {
    
    // 模拟 fastdigest 返回
    console.log("执行");
    
    const mockHash = {
    init: vi.fn(),
    update: vi.fn(),
    digest: vi.fn(() => 'test-checksum-123')
  };

    createXXHash64.mockResolvedValue(mockHash);
    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => mockHash)
    });
    
    // 模拟 FileReader
    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    // 启动上传并触发成功回调
    const uploadPromise = singles(mockJob);
    
    // 手动触发 tus 上传成功
    setTimeout(() => {
      mockTusUpload._triggerSuccess({ lastResponse: { _xhr: { status: 200 } } });
    }, 10);
    
    const result = await uploadPromise;

    // 验证结果
    expect(result).toBe(mockJob);
    expect(mockJob.checksum).toBe(mockHash);
    expect(mockJob.tus).toBeDefined();
    expect(mockTusUpload.start).toHaveBeenCalled();
  });

  it('处理上传进度更新', async () => {
    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => 'test-hash')
    });

    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    const uploadPromise = singles(mockJob);

    // 模拟进度更新
    setTimeout(() => {
      mockTusUpload._triggerProgress(512, 1024); // 50% 进度
    }, 5);

    setTimeout(() => {
      mockTusUpload._triggerSuccess({});
    }, 15);

    await uploadPromise;

    // 验证进度数据
    expect(mockJob.transmitPercentage).toBe('50.00');
    expect(mockJob.bytesUploaded).toBe(512);
    expect(mockJob.bytesTotal).toBe(1024);
  });

  it('处理上传错误', async () => {
    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => 'test-hash')
    });

    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    const uploadPromise = singles(mockJob);

    // 模拟上传错误
    const uploadError = new Error('Upload failed');
    setTimeout(() => {
      mockTusUpload._triggerError(uploadError);
    }, 10);

    await expect(uploadPromise).rejects.toThrow('Upload failed');
    expect(console.log).toHaveBeenCalledWith(uploadError);
  });

  it('处理无效的job参数', async () => {
    await expect(singles(null)).rejects.toBe('invalid/null job');
    await expect(singles({})).rejects.toBe('invalid/null job');
    await expect(singles({ id: 'test' })).rejects.toBe('invalid/null job');
  });

  it('正确设置上传URL回调', async () => {
    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => 'test-hash')
    });

    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    const uploadPromise = singles(mockJob);

    // 模拟上传URL可用回调
    const testUrl = 'https://example.com/upload/123';
    mockJob.tus = { url: testUrl };
    
    // 手动调用 onUploadUrlAvailable
    const tusOptions = mockTusUpload.options;
    if (tusOptions.onUploadUrlAvailable) {
      tusOptions.onUploadUrlAvailable();
    }

    setTimeout(() => {
      mockTusUpload._triggerSuccess({});
    }, 10);

    await uploadPromise;

    expect(mockJob.url).toBe(testUrl);
  });

  it('使用正确的元数据和配置', async () => {
    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => 'computed-checksum')
    });

    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    const uploadPromise = singles(mockJob);

    setTimeout(() => {
      mockTusUpload._triggerSuccess({});
    }, 10);

    await uploadPromise;

    // 验证 tus Upload 被正确调用
    const { Upload } = require('tus-js-client');
    expect(Upload).toHaveBeenCalledWith(
      mockJob.file,
      expect.objectContaining({
        endpoint: expect.stringContaining('/api/file?metadata='),
        chunkSize: 1024 * 1024 * 4,
        retryDelays: [0, 1000, 3000, 5000],
        parallelUploads: 1,
        metadata: expect.objectContaining({
          filename: 'test-file.txt',
          filetype: 'text/plain',
          filesize: 1024,
          lastModified: 1640995200000,
          checksum: 'computed-checksum'
        })
      })
    );
  });

  it('使用自定义store配置', async () => {
    // 更新store配置
    fileStore.update(s => ({
      ...s,
      endpoint: '/custom/upload',
      chunkSize: 1024 * 512,
      parallelUploads: 3
    }));

    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => 'test-hash')
    });

    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    const uploadPromise = singles(mockJob);

    setTimeout(() => {
      mockTusUpload._triggerSuccess({});
    }, 10);

    await uploadPromise;

    // 验证使用了自定义配置
    const { Upload } = require('tus-js-client');
    expect(Upload).toHaveBeenCalledWith(
      mockJob.file,
      expect.objectContaining({
        endpoint: expect.stringContaining('/custom/upload?metadata='),
        chunkSize: 1024 * 512,
        parallelUploads: 3
      })
    );
  });

  it('处理fastdigest失败的情况', async () => {
    // 模拟fastdigest失败
    vi.mocked(createXXHash64).mockRejectedValue(new Error('Hash calculation failed'));

    await expect(singles(mockJob)).rejects.toThrow('Hash calculation failed');
  });

  it('验证元数据编码正确性', async () => {
    const mockHashValue = 'test-checksum-456';
    vi.mocked(createXXHash64).mockResolvedValue({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => mockHashValue)
    });

    global.FileReader = vi.fn(() => ({
      onload: null,
      readAsArrayBuffer: vi.fn(function() {
        setTimeout(() => {
          this.onload({
            target: {
              result: new ArrayBuffer(1024)
            }
          });
        }, 0);
      })
    }));

    // 使用包含特殊字符的文件名
    const specialFile = {
      name: '测试文件 with spaces & symbols.txt',
      type: 'text/plain',
      size: 2048,
      lastModified: 1640995200000,
      slice: vi.fn(() => new ArrayBuffer(2048))
    };

    const specialJob = {
      id: 'special-job',
      file: specialFile
    };

    const uploadPromise = singles(specialJob);

    setTimeout(() => {
      mockTusUpload._triggerSuccess({});
    }, 10);

    await uploadPromise;

    // 验证元数据包含正确的编码
    const { Upload } = require('tus-js-client');
    const call = Upload.mock.calls[0];
    const options = call[1];
    
    expect(options.metadata.filename).toBe('测试文件 with spaces & symbols.txt');
    expect(options.metadata.checksum).toBe(mockHashValue);
    expect(options.metadata.filesize).toBe(2048);
    
    // 验证endpoint包含编码的元数据
    expect(options.endpoint).toContain('metadata=');
  });
});

describe('tusInit 函数测试', () => {
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('当 tus 不存在时应打印 tus unsupported', () => {
    // 模拟全局没有 tus
    global.tus = undefined;

    tusInit(); // 直接调用函数（需先导入或挂载到全局）

    expect(consoleSpy).toHaveBeenCalledWith('tus unsupported');
  });

  it('当 tus.isSupported 为 false 时应打印 tus unsupported', () => {
    global.tus = { isSupported: false };

    tusInit();

    expect(consoleSpy).toHaveBeenCalledWith('tus unsupported');
  });
});


describe('encodeMetadata 纯函数测试', () => {
  it('应正确编码 ASCII 文件名', () => {
    const meta = { filename: 'test.pdf', filetype: 'application/pdf' };
    const out = encodeMetadata(meta);
    expect(out).toBe(
      `filename ${btoa('test.pdf')},filetype ${btoa('application/pdf')}`
    );
  });

  it('应正确编码包含空格的 Unicode 文件名', () => {
    const meta = { filename: '测试 文件.pdf' };
    const out = encodeMetadata(meta);
    expect(out).toBe(
      `filename ${btoa(unescape(encodeURIComponent('测试 文件.pdf')))}`
    );
  });

  it('应正确编码空值字段', () => {
    const meta = { empty: '' };
    const out = encodeMetadata(meta);
    expect(out).toBe(`empty ${btoa('')}`);
  });

  it('应正确编码数字类型字段', () => {
    const meta = { size: 1024 };
    const out = encodeMetadata(meta);
    expect(out).toBe(`size ${btoa('1024')}`);
  });

  it('应同时编码多个字段并保持顺序', () => {
    const meta = {
      filename: 'a.pdf',
      filetype: 'application/pdf',
      size: 1024,
    };
    const out = encodeMetadata(meta);
    expect(out).toBe(
      [
        `filename ${btoa('a.pdf')}`,
        `filetype ${btoa('application/pdf')}`,
        `size ${btoa('1024')}`,
      ].join(',')
    );
  });
});

  describe('Store 订阅和反应性测试', () => {
    it('store变化应该触发订阅回调', () => {
      const mockCallback = vi.fn();
      
      const unsubscribe = fileStore.subscribe(mockCallback);
      
      fileStore.update(s => ({ ...s, criteria: 'new-criteria' }));
      
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        criteria: 'new-criteria'
      }));
      
      unsubscribe();
    });

    it('多个订阅者应该都能收到更新', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = fileStore.subscribe(callback1);
      const unsubscribe2 = fileStore.subscribe(callback2);
      
      fileStore.update(s => ({ ...s, parallelUploads: 5 }));
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      
      unsubscribe1();
      unsubscribe2();
    });

    it('jobs Map应该能正确添加和删除', () => {
      const testJob = { id: 'test-job', status: 'pending' };
      
      fileStore.update(s => {
        const newJobs = new Map(s.jobs);
        newJobs.set('test-job', testJob);
        return { ...s, jobs: newJobs };
      });
      
      let storeValue = get(fileStore);
      expect(storeValue.jobs.has('test-job')).toBe(true);
      expect(storeValue.jobs.get('test-job')).toEqual(testJob);
      
      fileStore.update(s => {
        const newJobs = new Map(s.jobs);
        newJobs.delete('test-job');
        return { ...s, jobs: newJobs };
      });
      
      storeValue = get(fileStore);
      expect(storeValue.jobs.has('test-job')).toBe(false);
    });
  });

  describe('边界情况和错误处理', () => {
    it('queryFiles - 处理无效的JSON响应', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '100']]),
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await queryFiles();

      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('fastdigest - 处理零字节文件', async () => {
      const mockFile = {
        size: 0,
        slice: vi.fn(() => new ArrayBuffer(0))
      };

      const job = { id: 'empty-file', file: mockFile };

      // 模拟空文件读取
      setTimeout(() => {
        mockFileReader.onload({
          target: {
            result: new ArrayBuffer(0)
          }
        });
      }, 0);

      await expect(fastdigest(job)).resolves.toBe('computed-hash');
      
      expect(job.sumProgress).toBe('100.00');
    });

    it('处理非常大的文件', async () => {
      const veryLargeSize = Number.MAX_SAFE_INTEGER;
      const mockFile = {
        size: veryLargeSize,
        slice: vi.fn(() => new ArrayBuffer(1024))
      };

      const job = { id: 'large-file', file: mockFile };

      setTimeout(() => {
        mockFileReader.onload({
          target: {
            result: new ArrayBuffer(1024)
          }
        });
      }, 0);

      const hashPromise = fastdigest(job);
      
      // 由于文件很大，进度应该是一个很小的数值
      await expect(hashPromise).resolves.toBe('computed-hash');
      expect(parseFloat(job.sumProgress)).toBeLessThan(0.01);
    });
  });
});

// describe('FileUpload 集成测试', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//     console.log = vi.fn();
//     console.error = vi.fn();
    
//     global.fetch = vi.fn();
//   });

//   it('完整的文件查询和哈希计算流程', async () => {
//     // 1. 查询文件
//     const mockFiles = [
//       {
//         ID: 'test-file',
//         Size: 1024,
//         MetaData: {
//           filename: 'test.txt',
//           filesize: 1024,
//           checksum: 'existing-checksum'
//         }
//       }
//     ];

//     global.fetch.mockResolvedValue({
//       ok: true,
//       headers: new Map([['content-length', '100']]),
//       json: () => Promise.resolve(mockFiles)
//     });

//     await queryFiles();

//     // 2. 验证文件已添加到store
//     let storeValue = get(fileStore);
//     expect(storeValue.uploadedFiles).toHaveLength(1);

//     // 3. 计算新文件的哈希
//     const mockFile = {
//       size: 512,
//       slice: vi.fn(() => new ArrayBuffer(512))
//     };

//     const job = { id: 'new-job', file: mockFile };

//     global.FileReader = vi.fn(() => ({
//       onload: null,
//       readAsArrayBuffer: vi.fn(function() {
//         setTimeout(() => {
//           this.onload({
//             target: {
//               result: new ArrayBuffer(512)
//             }
//           });
//         }, 0);
//       })
//     }));

//     const hashResult = await fastdigest(job);

//     expect(hashResult).toBe('computed-hash');
//     expect(job.sumProgress).toBe('100.00');
//   });
// });