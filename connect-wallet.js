const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://asset.battlecity.io/Metadata/tonconnect-mainfest.json",
  // buttonRootId: 'ton-connect'
});

let currentTonWalletInfo = {};

let interval;

const customWallet = {
  appName: "telegram-wallet",
  name: "Wallet",
  imageUrl: "https://wallet.tg/images/logo-288.png",
  aboutUrl: "https://wallet.tg/",
  universalLink: "https://t.me/wallet/start",
  bridgeUrl: "https://bridge.tonapi.io/bridge",
  platforms: ["ios", "android", "macos", "windows", "linux"],
};

tonConnectUI.uiOptions = {
  walletsListConfiguration: {
    includeWallets: [customWallet],
  },
};

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

const connect = async () => {
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
};
