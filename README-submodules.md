# submoduleへのアクセスについて

`github.com`は、セキュリティのためgitコマンドでパスワード認証はできな
いが、必ずしも全員がSSHの公開鍵をgithubに置き、ローカルのagentでsshの
decryptできるようにしているとは限らない。PAT(personal access token)を
生成してPATのパスワードでアクセスしていることも考えられる。

## SSHユーザーが行うべき対応
そのため、[`.gitmodules`](.gitmodules)はhttpsアクセス記述にしておき、
(自分を含め)SSHユーザー用には`.git/config`を書き換える[スクリプト
`submodule-url.sh`](./submodule-url.sh)を用意する。最初に
cloneした後、[これ](./submodule-url.sh)を実行
すれば自動的に`.git/config`が書き換わり、その後のpush/pullはSSHで行う
ようになる。

SSHユーザーは最初の最初にこのリポジトリをcloneする時`--recurse-submodules`を
付けても`.gitmodule`のURLがそのまま使われるためsubmoduleの取得に失敗するだろう。
最初は、(recursiveでなく)cloneしたあと`git submodule init`を行って
`.git/config`に内容を反映させ、その後、`./submodule-url.sh`でSSHに書き換え、
その後`git submodule update`でサブモジュールをcheckoutする必要がある。

## HTTPSユーザーが行うべき対応
HTTPSユーザーは、何もしないとcredential helperが動かないため、以下をおすすめする
```
git config --global credential.helper cache
```
credential helperをcacheにしていれば15分パスワードの再入力は不要となる

## 今後のアクセス権の方針
いずれこのリポジトリもprivateに戻してsubmoduleと同じアクセス権限(コラボレーター)に
しておくほうが便利かもしれないが、
```
git ls-remote https://github.com/TSUSAKA-ucl/moveit_jacobian.git
```
などの影響の無いコマンドで、credential helperにPATを覚えさせれば、15分間は
再入力不要となるので、現状のままでもさほど不便では無いでしょう。
