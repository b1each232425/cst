import { writable,get } from 'svelte/store';
import { createXXHash64 } from 'hash-wasm';
import { filesize } from 'filesize';
export const fileStore = writable({
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
// export let criteria       = writable('.*');
// export let fileApi        = writable('/api/file');          
// export let endpoint       = writable('/api/file');
// export const CHUNKSIZE    = writable(1024 * 1024 * 4);    
// export let chunkSize      = writable(CHUNKSIZE);
// export let parallelUploads= writable(1);
// export let jobs           = writable(new Map());
// export let uploadedFiles  = writable([]);
// export let selectedFiles  = writable();   
// export let clearSelectedFiles = () => {
//     selectedFiles = new DataTransfer().files;
//   };
fileStore.subscribe(value => {
  console.log('fileStore updated:', value);
});

export function tusInit(tus) {
		if (!tus || !tus.isSupported) {
			console.log('tus unsupported');
			return;
		}
	}

export function encodeMetadata(metadata) {
    const encodedPairs = [];
    for (const [key, value] of Object.entries(metadata)) {
        const encodedValue = btoa(unescape(encodeURIComponent(String(value))));
        encodedPairs.push(`${key} ${encodedValue}`);
    }
    return encodedPairs.join(',');
}


export function clearSelectedFiles() {
  fileStore.update(s => ({ ...s, selectedFiles: new DataTransfer().files }));
}

export function queryFiles() {
  const  { criteria, fileApi } = get(fileStore);
  const v = encodeURIComponent(criteria);
  fetch(`${fileApi}/nonexistence?q=${v}`)
    .then(r => {
      const size = r.headers.get('content-length');
      return (!r.ok || size === '0') ? [] : r.json();
    })
    .then(list => {
      if (!list?.length) {
        console.log('empty file list');
        return;
      }
      const d = list.map(item => ({
        url: `${fileApi}/${item.ID}`,
        filename: item.MetaData.filename ?? item.ID,
        filesize: item.MetaData.filesize ?? item.Size,
        checksum: item.MetaData.checksum ?? item.ID,
        ...item.MetaData
      }));
       fileStore.update(s => ({ ...s, uploadedFiles: d }));
    })
    .catch(console.error);
}

export function fastdigest(job){
    const  { CHUNKSIZE } = get(fileStore);
    return new Promise(async (resolve, reject) => {
      if (!job || !job.file) {
        reject('invalid/null job');
        return;
      }

      let md = await createXXHash64();
      md.init();

      let fileReader = new FileReader();

      let read = 0;
      fileReader.onload = (e) => {
        if (!e || !e.target || !e.target.result) {
          let err = new Error('invalid event.target.result');
          console.log(err);
          fileStore.update(s => {
          const newJobs = new Map(s.jobs);
          newJobs.delete(job.id);
          return { ...s, jobs: newJobs };
        });
          reject(err);
          return;
        }

        read += e.target.result.byteLength;
        let buf = new Uint8Array(e.target.result);
        md.update(buf);
        seek();
      };

      let fileSize = job.file.size;
      let start = 0,
        end = 0;

      let seek = () => {
        let now = new Date();
        job.sumPerformance = (((read * 1.0) / (now.getTime() - beginTime.getTime())) * 1000) / (1024 * 1024);

        job.sumProgress = (((read * 1.0) / fileSize) * 100).toFixed(2);
        if (read >= fileSize) {
          let hex = md.digest();
          resolve(hex);
          return;
        }

        end += CHUNKSIZE;
        end = end < fileSize ? end : fileSize + 1;
        let slice = job.file.slice(start, end);

        fileReader.readAsArrayBuffer(slice);
        start = end;
      };

      let beginTime = new Date();
      seek();
    });
  };

// export async function singles(job) {
//     return new Promise(async (resolve, reject) => {
//       if (!job || !job.file) {
//         reject('invalid/null job');
//         return;
//       }

//       job.checksum = await fastdigest(job);
//       let metadata = {
//         filename: job.file.name,
//         filetype: job.file.type,
//         filesize: job.file.size,
//         lastModified: job.file.lastModified,
//         checksum: job.checksum,
//       };

//       const encodedMetadata = encodeMetadata(metadata);
//       let v = encodeURIComponent(encodedMetadata);
//       // console.log(v);
//       const tusOptions = {
//         endpoint: `${get(fileStore).endpoint}?metadata=${v}`,
//         chunkSize:get(fileStore).chunkSize,
//         retryDelays: [0, 1000, 3000, 5000],
//         parallelUploads:get(fileStore).parallelUploads,
//         metadata,
//         onUploadUrlAvailable() {
//           job.url = job.tus.url;
//         },
//         onError(error) {
//           console.log(error);
//           reject(error);
//         },
//         onProgress(bytesUploaded, bytesTotal) {
//           job.transmitPercentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
//           job.bytesUploaded = bytesUploaded;
//           job.bytesTotal = bytesTotal;
//         },
//         onSuccess(resp) {
//           // let x = resp.lastResponse._xhr;
//           // let msg = `上传成功`;
//           // if (x.status === 208) {
//           // 	msg = '文件已经在服务器上了';
//           // }
//           // console.log(`${metadata.filename} ${msg}(${x.status}): ${job.url}`);

//           resolve(job);
//         },
//       };
//       job.tus = new tus.Upload(job.file, tusOptions);
//       job.tus.start();
//     });
//   }