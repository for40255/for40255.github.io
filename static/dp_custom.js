
const OVERLAY_ = document.querySelector('.overlay');
let MAX_TRY_NUM = 10;
let CURR_TRY_NUM = 0;

const match = window.location.search.match(/[?&]url=([^&]+)/);
let PALY_URL = match ? match[1] : null;

function initDplayer(dp) {
  enableUrlCopy(dp);    
  showPlayButton();

  const dp_playButton = dp.template.playButton;
  dp_playButton.addEventListener('click', dp_play_icon_fist_bind, { once: true }); 

  OVERLAY_.addEventListener('click', () => { 
    loadSource(dp, PALY_URL);
    //showLoadingCycle();
    dp_play_icon_fist_bind();
    dp_playButton.removeEventListener('click', dp_play_icon_fist_bind);

  }, { once: true }); 

  //dp.on('canplay', () => { } );

  dp.on('playing', () => {
    //console.log('playing');
    CURR_TRY_NUM = 0;
  });

  dp.on('error', (event) => {
    console.error("發生播放錯誤，類型:", event);
    if (CURR_TRY_NUM < MAX_TRY_NUM) {
      CURR_TRY_NUM += 1
      console.warn(`嘗試重新連線中:${CURR_TRY_NUM}...`);
      dp.notice(`嘗試重新連線中:${CURR_TRY_NUM}...`)
      setTimeout(() => {
        loadSource(dp, PALY_URL)
      }, 500);
    } else {
      alert(`已到達最大重試次數:${MAX_TRY_NUM} 結束連線 該網址可能無效或無法播放`);
    }
  });
  
  window.dp = dp;
}

function loadSource(dp, url, play=true){
  dp.switchVideo({url: url}); 
  dp.options.video.url = url; // 修復右鍵"影片統計訊息"無VideoURL
  if (play) dp.play();
}

function showPlayButton() {
  OVERLAY_.classList.remove('cycle');
  OVERLAY_.classList.add('play');
}

function showLoadingCycle() {
  OVERLAY_.classList.remove('play');
  OVERLAY_.classList.add('cycle');
}

function hideEverything() {
  OVERLAY_.classList.remove('play', 'cycle');
}

function addPipButton(dp) {
  // 1. 找到控制條右側圖示的容器
  const rightIcons = dp.template.container.querySelector('.dplayer-icons.dplayer-icons-right');
  
  // 如果找不到控制條（有些版本或設定下會隱藏），就跳出
  if (!rightIcons) return;
  
  // 2. 建立一個新的 span 作為按鈕容器
  const pipBtn = document.createElement('span');
  // 給它 DPlayer 標準的圖示類別，讓它看起來跟其他按鈕一致
  pipBtn.className = 'dplayer-icon dplayer-pip-icon'; 
  // 為了滑鼠懸停顯示文字 (Tooltip)，我們用 title
  //pipBtn.title = '畫中畫'; 
  pipBtn.setAttribute('data-balloon', '子母畫面');
  pipBtn.setAttribute('data-balloon-pos', 'up');

  // 3. 塞入上面的 SVG 代碼 (將文字內容替換成 SVG)
  pipBtn.innerHTML = `
      <span class="dplayer-icon-content">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32">
          <path fill="currentColor" d="M28 2H4C2.895 2 2 2.895 2 4v24c0 1.105 0.895 2 2 2h24c1.105 0 2-0.895 2-2V4c0-1.105-0.895-2-2-2zM26 26H6V6h20v20z"/>
          <path fill="currentColor" d="M26 26v-8h-8v8h8z"/>
        </svg>
      </span>
  `;

  // 4. 點擊事件：觸發畫中畫功能
  pipBtn.addEventListener('click', () => {
      if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
      } else if (dp.video.requestPictureInPicture) {
          dp.video.requestPictureInPicture();
      } else {
          alert('此瀏覽器不支援畫中畫功能');
      }
  });

  // 5. 插入到控制條最前面
  rightIcons.insertBefore(pipBtn, rightIcons.firstChild);
} 

function copyToClipboardLegacy(text) {
  // 1. 建立一個暫時的 textarea
  const textArea = document.createElement("textarea");
  
  // 2. 將 textarea 設定為「不可見」但保持在 DOM 中
  // 使用絕對定位並移出螢幕可視區，避免閃爍或影響佈局
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "-9999px"; 
  textArea.style.width = "2em";
  textArea.style.height = "2em";
  textArea.style.padding = "0";
  textArea.style.border = "none";
  textArea.style.outline = "none";
  textArea.style.boxShadow = "none";
  textArea.style.background = "transparent";
  
  textArea.value = text;
  document.body.appendChild(textArea);
  
  // 3. 執行選取與複製
  textArea.focus();
  textArea.select();
  
  let successful = false;

  try {
    successful = document.execCommand('copy');
    if (successful) console.log('複製成功');
    else console.error('複製失敗');

  } catch (err) {
    console.error('無法複製:', err);
  } finally {
    if (document.body.contains(textArea)) {
        document.body.removeChild(textArea);
    }
  }

  return successful;
}

function enableUrlCopy(dp) {
  // 等待面板 DOM 渲染完成
  const infoPanel = dp.template.infoPanel;
  
  infoPanel.addEventListener('click', (e) => {
    const urlData = e.target.closest('.dplayer-info-panel-item-url .dplayer-info-panel-item-data');
    
    if (urlData) {
      const textToCopy = urlData.innerText;
      
      if (copyToClipboardLegacy(textToCopy)) {
        const originalText = urlData.innerText;
        urlData.innerText = '✅ 已複製到剪貼簿！';
        urlData.style.color = '#00a1d6';
        
        setTimeout(() => {
            urlData.innerText = originalText;
            urlData.style.color = '';
        }, 2000);
      }
    }
    
  });

}

function prompt_url(dp, play=false) {
  let result = window.prompt("請輸入新的播放連結:", "");
  if (result) { 
    PALY_URL = result; 
    loadSource(dp, PALY_URL, play); 
    return true; 
  }
  return false;
}

function notic(dp) {
  alert("請在URL加上?url=XX.m3u8 或在接下來視窗輸入要播放的連結");
  if (prompt_url(dp, false)) {
    initDplayer(dp);
    return true;
  }
}

const dp_play_icon_fist_bind = () => {
  dp.template.mobilePlayButton.classList.remove('hide');
  OVERLAY_.style.zIndex = -99999;
  hideEverything();
}

