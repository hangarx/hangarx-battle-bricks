const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://asset.battlecity.io/Metadata/tonconnect-mainfest.json",
  // buttonRootId: 'ton-connect'
});

const baseURL = "https://api-polygon.battlecity.io";

let currentTonWalletInfo = {};

let interval;

// const customWallet = {
//   appName: "telegram-wallet",
//   name: "Wallet",
//   imageUrl: "https://wallet.tg/images/logo-288.png",
//   aboutUrl: "https://wallet.tg/",
//   universalLink: "https://t.me/wallet/start",
//   bridgeUrl: "https://bridge.tonapi.io/bridge",
//   platforms: ["ios", "android", "macos", "windows", "linux"],
// };

// tonConnectUI.uiOptions = {
//   walletsListConfiguration: {
//     includeWallets: [customWallet],
//   },
// };

const getWallets = async () => {
  const walletsList = await tonConnectUI.getWallets();
  console.log(walletsList);
};

function generatePayload() {
  const s = TonWeb.utils.bytesToHex(TonWeb.utils.nacl.randomBytes(32));
  return s;
}

function refreshPayload() {
  tonConnectUI.setConnectRequestParameters({ state: "loading" });

  const value = generatePayload();
  if (!value) {
  } else {
    tonConnectUI.setConnectRequestParameters({
      state: "ready",
      value: {
        tonProof: value,
      },
    });
  }
}

async function waitForGettingWalletInfo() {
  let interv;
  return new Promise((resolve) => {
    interv = setInterval(() => {
      if (Object.keys(currentTonWalletInfo || {}).length > 0) {
        clearInterval(interv);
        resolve(true);
      }
    }, 500);
  });
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const connect = async () => {
  const at = getCookie("accessToken");
  if(at) {
    return;
  }
  const payloadTTLMS = 1000 * 60 * 20;
  refreshPayload();
  const connected = await tonConnectUI.connectionRestored;
  if (connected) {
    await tonConnectUI.disconnect();
  }
  await tonConnectUI.openModal();
  interval = setInterval(refreshPayload, payloadTTLMS);

  tonConnectUI.onStatusChange((walletAndwalletInfo) => {
    // update state/reactive variables to show updates in the ui
    currentTonWalletInfo = walletAndwalletInfo;
  });
  await waitForGettingWalletInfo();

  const dryAddress =
    currentTonWalletInfo.account?.address || tonConnectUI?.account?.address;
  // alert(dryAddress);

  let address = new TonWeb.utils.Address(dryAddress);

  const addressPrime = address.toString(true, true, true, false);
  console.log(addressPrime);

  const result = await axios.post(baseURL + "/auth/nonce", {
    system: "battle_city",
    game: "battle_city_portal",
    api_key: "YV8Np3404Ynf4rb6qF9J",
    address: addressPrime,
    chain: "polygon",
  });

  if (result?.data?.status === "OK") {
    const getAccessTokenResult = await axios.post(baseURL + "/auth/token", {
      address: addressPrime,
      type: "ton",
      walletInfo: currentTonWalletInfo,
      network: currentTonWalletInfo?.account?.chain,
      proofInput: {
        state_init: currentTonWalletInfo?.account?.walletStateInit,
      },
      connected: false,
      chain: "polygon",
      system: "battle_city",
      game: "battle_city_tank",
      api_key: "Z5hjpcEGxGfhzVSCGFLY",
    });
    const accessToken = getAccessTokenResult?.data?.result?.accessToken;
    setCookie("accessToken", accessToken, 5);
  }
};
