/**
 * 请求摄像头权限并返回媒体流
 * @returns Promise<MediaStream>
 */
export const requestCameraPermission = async (): Promise<MediaStream> => {
  try {
    // 首先尝试使用后置摄像头
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (envError) {
      console.warn('无法使用后置摄像头，尝试使用前置摄像头:', envError);
      
      // 如果后置摄像头不可用，尝试使用前置摄像头
      const frontConstraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(frontConstraints);
        return stream;
      } catch (userError) {
        console.warn('无法使用前置摄像头，尝试使用默认摄像头:', userError);
        
        // 如果前置摄像头也不可用，尝试使用默认摄像头
        const defaultConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
        return stream;
      }
    }
  } catch (error) {
    console.error('获取摄像头权限失败:', error);
    throw error;
  }
};

/**
 * 拍照并返回图片数据
 * @param stream 媒体流
 * @param video 视频元素
 * @returns Promise<HTMLImageElement>
 */
export const captureImage = async (stream: MediaStream, video: HTMLVideoElement): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    try {
      // 设置视频源
      video.srcObject = stream;
      
      // 当视频可以播放时进行截图
      video.oncanplay = () => {
        video.play();
        
        // 创建canvas进行截图
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'));
          return;
        }
        
        // 绘制当前视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 转换为图片
        const img = new Image();
        img.onload = () => {
          // 停止所有轨道
          stream.getTracks().forEach(track => track.stop());
          resolve(img);
        };
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
        img.src = canvas.toDataURL('image/jpeg');
      };
      
      video.onerror = () => {
        reject(new Error('视频播放失败'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 创建视频元素用于拍照
 * @returns HTMLVideoElement
 */
export const createVideoElement = (): HTMLVideoElement => {
  const video = document.createElement('video');
  video.style.display = 'none';
  document.body.appendChild(video);
  return video;
};

/**
 * 移除视频元素
 * @param video 视频元素
 */
export const removeVideoElement = (video: HTMLVideoElement): void => {
  if (video.parentNode) {
    video.parentNode.removeChild(video);
  }
};