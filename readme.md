반드시 로컬에서 테스트 할때는 npm start 후 node dist/web_es6.js 실행 git push 할때는 dist/web_es6.js 를 루트 디렉터리로 꺼낸다음 이름을 web.js 로 바꾸고 기존 web.js를 삭제한 후 push 한다.
왜냐하면 cafe24서버는 루트 디렉터리의 web.js를 실행하기 때문이다 추후 package.json 의 "scripts" 를 수정하여 src 폴더에 es6 파일을 넣고 루트 디렉터리에 변환된 파일이 오도록 한다.

개인 레파지토리에 푸쉬 할때는 git add web_es6.js package-lock.json readme.md package.json && git commit && git push gotree master
