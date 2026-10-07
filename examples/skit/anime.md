---
title: 転校生は宇宙人？
layout: skit
format: wide
style: anime             # 吹き出しの寸劇
speakers:
  わかば: zundamon
  あお: tsumugi
characters:
  わかば: builtin
  あお: builtin-blue
---

<!-- 吹き出しで話す短い寸劇。出入り（!enter / !exit）と動きで場面を作る -->

## 朝の教室 bg=sky
!exit あお
わかば: {face:normal}今日、転校生が来るらしいよ。
!enter あお right
!se whoosh
あお: {face:smile}{act:jump}はじめまして！
わかば: {face:surprised}{act:shake}{fx:flash}{se:don}その頭のアンテナ、なに？

## 正体 bg=speed transition=zoom
あお: {face:think}{act:nod}これはただの寝ぐせです。
!stamp ？
わかば: {face:troubled}寝ぐせが光ってるけど。
!move あお center
あお: {face:surprised}{act:spin}{fx:lines}{se:kira}バレたなら仕方ない！

## オチ bg=sky transition=flash
!caption 実は style=pop
あお: {face:smile}隣のクラスから来ました。
わかば: {face:troubled}{act:fall}{se:zukoo}近っ！
!se chin
