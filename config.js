/* 設定はここで変更します。認証用の秘密鍵を記載しないでください。 */
window.PIANO_CONFIG = {
  // 本番APIのURLに差し替えます（同一オリジンの相対URLも指定可能）。
  apiUrl: './demo/count.json',
  demoMode: true, // 本番APIへの切り替え時に false にしてください。
  timeoutMs: 8000,
  // レスポンス形式が変わったらここを修正。例: payload.data.total
  getCount: (payload) => payload.count,
  // 実際のスポットが決まったら追加。URLは https:// または http://。
  // { name: 'スポット名', description: '住所・利用時間', url: 'https://...' }
  spots: []
};
