(()=>{var{defineProperty:e0,getOwnPropertyNames:kQ,getOwnPropertyDescriptor:PQ}=Object,AQ=Object.prototype.hasOwnProperty;function TQ(J){return this[J]}var SQ=(J)=>{var $=(x6??=new WeakMap).get(J),Z;if($)return $;if($=e0({},"__esModule",{value:!0}),J&&typeof J==="object"||typeof J==="function"){for(var Q of kQ(J))if(!AQ.call($,Q))e0($,Q,{get:TQ.bind(J,Q),enumerable:!(Z=PQ(J,Q))||Z.enumerable})}return x6.set(J,$),$},x6;var jQ=(J)=>J;function vQ(J,$){this[J]=jQ.bind(null,$)}var yQ=(J,$)=>{for(var Z in $)e0(J,Z,{get:$[Z],enumerable:!0,configurable:!0,set:vQ.bind($,Z)})};var kq={};yQ(kq,{seedOf3:()=>OQ,rngOf3:()=>s0});var gZ=0;var j$=2;var pZ=2;var T0=1000,lZ=1001,uZ=1002,mZ=1003,dZ=1004;var cZ=1005;var S8=1006,nZ=1007;var j8=1008;var sZ=2300,v8=2301;var iZ=0,S0=1,v$=2;var e7="srgb",J9="srgb-linear";var y$=35048;class M9{addEventListener(J,$){if(this._listeners===void 0)this._listeners={};let Z=this._listeners;if(Z[J]===void 0)Z[J]=[];if(Z[J].indexOf($)===-1)Z[J].push($)}hasEventListener(J,$){if(this._listeners===void 0)return!1;let Z=this._listeners;return Z[J]!==void 0&&Z[J].indexOf($)!==-1}removeEventListener(J,$){if(this._listeners===void 0)return;let Q=this._listeners[J];if(Q!==void 0){let W=Q.indexOf($);if(W!==-1)Q.splice(W,1)}}dispatchEvent(J){if(this._listeners===void 0)return;let Z=this._listeners[J.type];if(Z!==void 0){J.target=this;let Q=Z.slice(0);for(let W=0,X=Q.length;W<X;W++)Q[W].call(this,J);J.target=null}}}var D7=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],f6=1234567,I$=Math.PI/180,X$=180/Math.PI;function n7(){let J=Math.random()*4294967295|0,$=Math.random()*4294967295|0,Z=Math.random()*4294967295|0,Q=Math.random()*4294967295|0;return(D7[J&255]+D7[J>>8&255]+D7[J>>16&255]+D7[J>>24&255]+"-"+D7[$&255]+D7[$>>8&255]+"-"+D7[$>>16&15|64]+D7[$>>24&255]+"-"+D7[Z&63|128]+D7[Z>>8&255]+"-"+D7[Z>>16&255]+D7[Z>>24&255]+D7[Q&255]+D7[Q>>8&255]+D7[Q>>16&255]+D7[Q>>24&255]).toLowerCase()}function C7(J,$,Z){return Math.max($,Math.min(Z,J))}function y8(J,$){return(J%$+$)%$}function xQ(J,$,Z,Q,W){return Q+(J-$)*(W-Q)/(Z-$)}function fQ(J,$,Z){if(J!==$)return(Z-J)/($-J);else return 0}function k$(J,$,Z){return(1-Z)*J+Z*$}function hQ(J,$,Z,Q){return k$(J,$,1-Math.exp(-Z*Q))}function bQ(J,$=1){return $-Math.abs(y8(J,$*2)-$)}function gQ(J,$,Z){if(J<=$)return 0;if(J>=Z)return 1;return J=(J-$)/(Z-$),J*J*(3-2*J)}function pQ(J,$,Z){if(J<=$)return 0;if(J>=Z)return 1;return J=(J-$)/(Z-$),J*J*J*(J*(J*6-15)+10)}function lQ(J,$){return J+Math.floor(Math.random()*($-J+1))}function uQ(J,$){return J+Math.random()*($-J)}function mQ(J){return J*(0.5-Math.random())}function dQ(J){if(J!==void 0)f6=J;let $=f6+=1831565813;return $=Math.imul($^$>>>15,$|1),$^=$+Math.imul($^$>>>7,$|61),(($^$>>>14)>>>0)/4294967296}function cQ(J){return J*I$}function nQ(J){return J*X$}function k8(J){return(J&J-1)===0&&J!==0}function sQ(J){return Math.pow(2,Math.ceil(Math.log(J)/Math.LN2))}function A0(J){return Math.pow(2,Math.floor(Math.log(J)/Math.LN2))}function iQ(J,$,Z,Q,W){let{cos:X,sin:H}=Math,Y=X(Z/2),q=H(Z/2),U=X(($+Q)/2),K=H(($+Q)/2),E=X(($-Q)/2),V=H(($-Q)/2),O=X((Q-$)/2),_=H((Q-$)/2);switch(W){case"XYX":J.set(Y*K,q*E,q*V,Y*U);break;case"YZY":J.set(q*V,Y*K,q*E,Y*U);break;case"ZXZ":J.set(q*E,q*V,Y*K,Y*U);break;case"XZX":J.set(Y*K,q*_,q*O,Y*U);break;case"YXY":J.set(q*O,Y*K,q*_,Y*U);break;case"ZYZ":J.set(q*_,q*O,Y*K,Y*U);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+W)}}function t7(J,$){switch($.constructor){case Float32Array:return J;case Uint32Array:return J/4294967295;case Uint16Array:return J/65535;case Uint8Array:return J/255;case Int32Array:return Math.max(J/2147483647,-1);case Int16Array:return Math.max(J/32767,-1);case Int8Array:return Math.max(J/127,-1);default:throw Error("Invalid component type.")}}function aJ(J,$){switch($.constructor){case Float32Array:return J;case Uint32Array:return Math.round(J*4294967295);case Uint16Array:return Math.round(J*65535);case Uint8Array:return Math.round(J*255);case Int32Array:return Math.round(J*2147483647);case Int16Array:return Math.round(J*32767);case Int8Array:return Math.round(J*127);default:throw Error("Invalid component type.")}}var oZ={DEG2RAD:I$,RAD2DEG:X$,generateUUID:n7,clamp:C7,euclideanModulo:y8,mapLinear:xQ,inverseLerp:fQ,lerp:k$,damp:hQ,pingpong:bQ,smoothstep:gQ,smootherstep:pQ,randInt:lQ,randFloat:uQ,randFloatSpread:mQ,seededRandom:dQ,degToRad:cQ,radToDeg:nQ,isPowerOfTwo:k8,ceilPowerOfTwo:sQ,floorPowerOfTwo:A0,setQuaternionFromProperEuler:iQ,normalize:aJ,denormalize:t7};class yJ{constructor(J=0,$=0){yJ.prototype.isVector2=!0,this.x=J,this.y=$}get width(){return this.x}set width(J){this.x=J}get height(){return this.y}set height(J){this.y=J}set(J,$){return this.x=J,this.y=$,this}setScalar(J){return this.x=J,this.y=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setComponent(J,$){switch(J){case 0:this.x=$;break;case 1:this.y=$;break;default:throw Error("index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;default:throw Error("index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y)}copy(J){return this.x=J.x,this.y=J.y,this}add(J){return this.x+=J.x,this.y+=J.y,this}addScalar(J){return this.x+=J,this.y+=J,this}addVectors(J,$){return this.x=J.x+$.x,this.y=J.y+$.y,this}addScaledVector(J,$){return this.x+=J.x*$,this.y+=J.y*$,this}sub(J){return this.x-=J.x,this.y-=J.y,this}subScalar(J){return this.x-=J,this.y-=J,this}subVectors(J,$){return this.x=J.x-$.x,this.y=J.y-$.y,this}multiply(J){return this.x*=J.x,this.y*=J.y,this}multiplyScalar(J){return this.x*=J,this.y*=J,this}divide(J){return this.x/=J.x,this.y/=J.y,this}divideScalar(J){return this.multiplyScalar(1/J)}applyMatrix3(J){let $=this.x,Z=this.y,Q=J.elements;return this.x=Q[0]*$+Q[3]*Z+Q[6],this.y=Q[1]*$+Q[4]*Z+Q[7],this}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this}clamp(J,$){return this.x=Math.max(J.x,Math.min($.x,this.x)),this.y=Math.max(J.y,Math.min($.y,this.y)),this}clampScalar(J,$){return this.x=Math.max(J,Math.min($,this.x)),this.y=Math.max(J,Math.min($,this.y)),this}clampLength(J,$){let Z=this.length();return this.divideScalar(Z||1).multiplyScalar(Math.max(J,Math.min($,Z)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(J){return this.x*J.x+this.y*J.y}cross(J){return this.x*J.y-this.y*J.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(J){let $=Math.sqrt(this.lengthSq()*J.lengthSq());if($===0)return Math.PI/2;let Z=this.dot(J)/$;return Math.acos(C7(Z,-1,1))}distanceTo(J){return Math.sqrt(this.distanceToSquared(J))}distanceToSquared(J){let $=this.x-J.x,Z=this.y-J.y;return $*$+Z*Z}manhattanDistanceTo(J){return Math.abs(this.x-J.x)+Math.abs(this.y-J.y)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,$){return this.x+=(J.x-this.x)*$,this.y+=(J.y-this.y)*$,this}lerpVectors(J,$,Z){return this.x=J.x+($.x-J.x)*Z,this.y=J.y+($.y-J.y)*Z,this}equals(J){return J.x===this.x&&J.y===this.y}fromArray(J,$=0){return this.x=J[$],this.y=J[$+1],this}toArray(J=[],$=0){return J[$]=this.x,J[$+1]=this.y,J}fromBufferAttribute(J,$){return this.x=J.getX($),this.y=J.getY($),this}rotateAround(J,$){let Z=Math.cos($),Q=Math.sin($),W=this.x-J.x,X=this.y-J.y;return this.x=W*Z-X*Q+J.x,this.y=W*Q+X*Z+J.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class hJ{constructor(J,$,Z,Q,W,X,H,Y,q){if(hJ.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],J!==void 0)this.set(J,$,Z,Q,W,X,H,Y,q)}set(J,$,Z,Q,W,X,H,Y,q){let U=this.elements;return U[0]=J,U[1]=Q,U[2]=H,U[3]=$,U[4]=W,U[5]=Y,U[6]=Z,U[7]=X,U[8]=q,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(J){let $=this.elements,Z=J.elements;return $[0]=Z[0],$[1]=Z[1],$[2]=Z[2],$[3]=Z[3],$[4]=Z[4],$[5]=Z[5],$[6]=Z[6],$[7]=Z[7],$[8]=Z[8],this}extractBasis(J,$,Z){return J.setFromMatrix3Column(this,0),$.setFromMatrix3Column(this,1),Z.setFromMatrix3Column(this,2),this}setFromMatrix4(J){let $=J.elements;return this.set($[0],$[4],$[8],$[1],$[5],$[9],$[2],$[6],$[10]),this}multiply(J){return this.multiplyMatrices(this,J)}premultiply(J){return this.multiplyMatrices(J,this)}multiplyMatrices(J,$){let Z=J.elements,Q=$.elements,W=this.elements,X=Z[0],H=Z[3],Y=Z[6],q=Z[1],U=Z[4],K=Z[7],E=Z[2],V=Z[5],O=Z[8],_=Q[0],R=Q[3],F=Q[6],G=Q[1],N=Q[4],z=Q[7],w=Q[2],k=Q[5],L=Q[8];return W[0]=X*_+H*G+Y*w,W[3]=X*R+H*N+Y*k,W[6]=X*F+H*z+Y*L,W[1]=q*_+U*G+K*w,W[4]=q*R+U*N+K*k,W[7]=q*F+U*z+K*L,W[2]=E*_+V*G+O*w,W[5]=E*R+V*N+O*k,W[8]=E*F+V*z+O*L,this}multiplyScalar(J){let $=this.elements;return $[0]*=J,$[3]*=J,$[6]*=J,$[1]*=J,$[4]*=J,$[7]*=J,$[2]*=J,$[5]*=J,$[8]*=J,this}determinant(){let J=this.elements,$=J[0],Z=J[1],Q=J[2],W=J[3],X=J[4],H=J[5],Y=J[6],q=J[7],U=J[8];return $*X*U-$*H*q-Z*W*U+Z*H*Y+Q*W*q-Q*X*Y}invert(){let J=this.elements,$=J[0],Z=J[1],Q=J[2],W=J[3],X=J[4],H=J[5],Y=J[6],q=J[7],U=J[8],K=U*X-H*q,E=H*Y-U*W,V=q*W-X*Y,O=$*K+Z*E+Q*V;if(O===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/O;return J[0]=K*_,J[1]=(Q*q-U*Z)*_,J[2]=(H*Z-Q*X)*_,J[3]=E*_,J[4]=(U*$-Q*Y)*_,J[5]=(Q*W-H*$)*_,J[6]=V*_,J[7]=(Z*Y-q*$)*_,J[8]=(X*$-Z*W)*_,this}transpose(){let J,$=this.elements;return J=$[1],$[1]=$[3],$[3]=J,J=$[2],$[2]=$[6],$[6]=J,J=$[5],$[5]=$[7],$[7]=J,this}getNormalMatrix(J){return this.setFromMatrix4(J).invert().transpose()}transposeIntoArray(J){let $=this.elements;return J[0]=$[0],J[1]=$[3],J[2]=$[6],J[3]=$[1],J[4]=$[4],J[5]=$[7],J[6]=$[2],J[7]=$[5],J[8]=$[8],this}setUvTransform(J,$,Z,Q,W,X,H){let Y=Math.cos(W),q=Math.sin(W);return this.set(Z*Y,Z*q,-Z*(Y*X+q*H)+X+J,-Q*q,Q*Y,-Q*(-q*X+Y*H)+H+$,0,0,1),this}scale(J,$){return this.premultiply(J8.makeScale(J,$)),this}rotate(J){return this.premultiply(J8.makeRotation(-J)),this}translate(J,$){return this.premultiply(J8.makeTranslation(J,$)),this}makeTranslation(J,$){if(J.isVector2)this.set(1,0,J.x,0,1,J.y,0,0,1);else this.set(1,0,J,0,1,$,0,0,1);return this}makeRotation(J){let $=Math.cos(J),Z=Math.sin(J);return this.set($,-Z,0,Z,$,0,0,0,1),this}makeScale(J,$){return this.set(J,0,0,0,$,0,0,0,1),this}equals(J){let $=this.elements,Z=J.elements;for(let Q=0;Q<9;Q++)if($[Q]!==Z[Q])return!1;return!0}fromArray(J,$=0){for(let Z=0;Z<9;Z++)this.elements[Z]=J[Z+$];return this}toArray(J=[],$=0){let Z=this.elements;return J[$]=Z[0],J[$+1]=Z[1],J[$+2]=Z[2],J[$+3]=Z[3],J[$+4]=Z[4],J[$+5]=Z[5],J[$+6]=Z[6],J[$+7]=Z[7],J[$+8]=Z[8],J}clone(){return new this.constructor().fromArray(this.elements)}}var J8=new hJ;function aZ(J){for(let $=J.length-1;$>=0;--$)if(J[$]>=65535)return!0;return!1}function T$(J){return document.createElementNS("http://www.w3.org/1999/xhtml",J)}function oQ(){let J=T$("canvas");return J.style.display="block",J}var h6={};function P$(J){if(J in h6)return;h6[J]=!0,console.warn(J)}var b6=new hJ().set(0.8224621,0.177538,0,0.0331941,0.9668058,0,0.0170827,0.0723974,0.9105199),g6=new hJ().set(1.2249401,-0.2249404,0,-0.0420569,1.0420571,0,-0.0196376,-0.0786361,1.0982735),J0={["srgb-linear"]:{transfer:"linear",primaries:"rec709",toReference:(J)=>J,fromReference:(J)=>J},["srgb"]:{transfer:"srgb",primaries:"rec709",toReference:(J)=>J.convertSRGBToLinear(),fromReference:(J)=>J.convertLinearToSRGB()},["display-p3-linear"]:{transfer:"linear",primaries:"p3",toReference:(J)=>J.applyMatrix3(g6),fromReference:(J)=>J.applyMatrix3(b6)},["display-p3"]:{transfer:"srgb",primaries:"p3",toReference:(J)=>J.convertSRGBToLinear().applyMatrix3(g6),fromReference:(J)=>J.applyMatrix3(b6).convertLinearToSRGB()}},aQ=new Set(["srgb-linear","display-p3-linear"]),iJ={enabled:!0,_workingColorSpace:"srgb-linear",get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(J){if(!aQ.has(J))throw Error(`Unsupported working color space, "${J}".`);this._workingColorSpace=J},convert:function(J,$,Z){if(this.enabled===!1||$===Z||!$||!Z)return J;let Q=J0[$].toReference,W=J0[Z].fromReference;return W(Q(J))},fromWorkingColorSpace:function(J,$){return this.convert(J,this._workingColorSpace,$)},toWorkingColorSpace:function(J,$){return this.convert(J,$,this._workingColorSpace)},getPrimaries:function(J){return J0[J].primaries},getTransfer:function(J){if(J==="")return"linear";return J0[J].transfer}};function W$(J){return J<0.04045?J*0.0773993808:Math.pow(J*0.9478672986+0.0521327014,2.4)}function $8(J){return J<0.0031308?J*12.92:1.055*Math.pow(J,0.41666)-0.055}var p9;class x8{static getDataURL(J){if(/^data:/i.test(J.src))return J.src;if(typeof HTMLCanvasElement>"u")return J.src;let $;if(J instanceof HTMLCanvasElement)$=J;else{if(p9===void 0)p9=T$("canvas");p9.width=J.width,p9.height=J.height;let Z=p9.getContext("2d");if(J instanceof ImageData)Z.putImageData(J,0,0);else Z.drawImage(J,0,0,J.width,J.height);$=p9}if($.width>2048||$.height>2048)return console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",J),$.toDataURL("image/jpeg",0.6);else return $.toDataURL("image/png")}static sRGBToLinear(J){if(typeof HTMLImageElement<"u"&&J instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&J instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&J instanceof ImageBitmap){let $=T$("canvas");$.width=J.width,$.height=J.height;let Z=$.getContext("2d");Z.drawImage(J,0,0,J.width,J.height);let Q=Z.getImageData(0,0,J.width,J.height),W=Q.data;for(let X=0;X<W.length;X++)W[X]=W$(W[X]/255)*255;return Z.putImageData(Q,0,0),$}else if(J.data){let $=J.data.slice(0);for(let Z=0;Z<$.length;Z++)if($ instanceof Uint8Array||$ instanceof Uint8ClampedArray)$[Z]=Math.floor(W$($[Z]/255)*255);else $[Z]=W$($[Z]);return{data:$,width:J.width,height:J.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),J}}var rQ=0;class f8{constructor(J=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rQ++}),this.uuid=n7(),this.data=J,this.version=0}set needsUpdate(J){if(J===!0)this.version++}toJSON(J){let $=J===void 0||typeof J==="string";if(!$&&J.images[this.uuid]!==void 0)return J.images[this.uuid];let Z={uuid:this.uuid,url:""},Q=this.data;if(Q!==null){let W;if(Array.isArray(Q)){W=[];for(let X=0,H=Q.length;X<H;X++)if(Q[X].isDataTexture)W.push(Z8(Q[X].image));else W.push(Z8(Q[X]))}else W=Z8(Q);Z.url=W}if(!$)J.images[this.uuid]=Z;return Z}}function Z8(J){if(typeof HTMLImageElement<"u"&&J instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&J instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&J instanceof ImageBitmap)return x8.getDataURL(J);else if(J.data)return{data:Array.from(J.data),width:J.width,height:J.height,type:J.data.constructor.name};else return console.warn("THREE.Texture: Unable to serialize Texture."),{}}var tQ=0;class O7 extends M9{constructor(J=O7.DEFAULT_IMAGE,$=O7.DEFAULT_MAPPING,Z=1001,Q=1001,W=1006,X=1008,H=1023,Y=1009,q=O7.DEFAULT_ANISOTROPY,U=""){super();if(this.isTexture=!0,Object.defineProperty(this,"id",{value:tQ++}),this.uuid=n7(),this.name="",this.source=new f8(J),this.mipmaps=[],this.mapping=$,this.channel=0,this.wrapS=Z,this.wrapT=Q,this.magFilter=W,this.minFilter=X,this.anisotropy=q,this.format=H,this.internalFormat=null,this.type=Y,this.offset=new yJ(0,0),this.repeat=new yJ(1,1),this.center=new yJ(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new hJ,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof U==="string")this.colorSpace=U;else P$("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=U===3001?"srgb":"";this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(J=null){this.source.data=J}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(J){return this.name=J.name,this.source=J.source,this.mipmaps=J.mipmaps.slice(0),this.mapping=J.mapping,this.channel=J.channel,this.wrapS=J.wrapS,this.wrapT=J.wrapT,this.magFilter=J.magFilter,this.minFilter=J.minFilter,this.anisotropy=J.anisotropy,this.format=J.format,this.internalFormat=J.internalFormat,this.type=J.type,this.offset.copy(J.offset),this.repeat.copy(J.repeat),this.center.copy(J.center),this.rotation=J.rotation,this.matrixAutoUpdate=J.matrixAutoUpdate,this.matrix.copy(J.matrix),this.generateMipmaps=J.generateMipmaps,this.premultiplyAlpha=J.premultiplyAlpha,this.flipY=J.flipY,this.unpackAlignment=J.unpackAlignment,this.colorSpace=J.colorSpace,this.userData=JSON.parse(JSON.stringify(J.userData)),this.needsUpdate=!0,this}toJSON(J){let $=J===void 0||typeof J==="string";if(!$&&J.textures[this.uuid]!==void 0)return J.textures[this.uuid];let Z={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(J).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)Z.userData=this.userData;if(!$)J.textures[this.uuid]=Z;return Z}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(J){if(this.mapping!==300)return J;if(J.applyMatrix3(this.matrix),J.x<0||J.x>1)switch(this.wrapS){case 1000:J.x=J.x-Math.floor(J.x);break;case 1001:J.x=J.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(J.x)%2)===1)J.x=Math.ceil(J.x)-J.x;else J.x=J.x-Math.floor(J.x);break}if(J.y<0||J.y>1)switch(this.wrapT){case 1000:J.y=J.y-Math.floor(J.y);break;case 1001:J.y=J.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(J.y)%2)===1)J.y=Math.ceil(J.y)-J.y;else J.y=J.y-Math.floor(J.y);break}if(this.flipY)J.y=1-J.y;return J}set needsUpdate(J){if(J===!0)this.version++,this.source.needsUpdate=!0}get encoding(){return P$("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace==="srgb"?3001:3000}set encoding(J){P$("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=J===3001?"srgb":""}}O7.DEFAULT_IMAGE=null;O7.DEFAULT_MAPPING=300;O7.DEFAULT_ANISOTROPY=1;class J7{constructor(J=0,$=0,Z=0,Q=1){J7.prototype.isVector4=!0,this.x=J,this.y=$,this.z=Z,this.w=Q}get width(){return this.z}set width(J){this.z=J}get height(){return this.w}set height(J){this.w=J}set(J,$,Z,Q){return this.x=J,this.y=$,this.z=Z,this.w=Q,this}setScalar(J){return this.x=J,this.y=J,this.z=J,this.w=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setZ(J){return this.z=J,this}setW(J){return this.w=J,this}setComponent(J,$){switch(J){case 0:this.x=$;break;case 1:this.y=$;break;case 2:this.z=$;break;case 3:this.w=$;break;default:throw Error("index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(J){return this.x=J.x,this.y=J.y,this.z=J.z,this.w=J.w!==void 0?J.w:1,this}add(J){return this.x+=J.x,this.y+=J.y,this.z+=J.z,this.w+=J.w,this}addScalar(J){return this.x+=J,this.y+=J,this.z+=J,this.w+=J,this}addVectors(J,$){return this.x=J.x+$.x,this.y=J.y+$.y,this.z=J.z+$.z,this.w=J.w+$.w,this}addScaledVector(J,$){return this.x+=J.x*$,this.y+=J.y*$,this.z+=J.z*$,this.w+=J.w*$,this}sub(J){return this.x-=J.x,this.y-=J.y,this.z-=J.z,this.w-=J.w,this}subScalar(J){return this.x-=J,this.y-=J,this.z-=J,this.w-=J,this}subVectors(J,$){return this.x=J.x-$.x,this.y=J.y-$.y,this.z=J.z-$.z,this.w=J.w-$.w,this}multiply(J){return this.x*=J.x,this.y*=J.y,this.z*=J.z,this.w*=J.w,this}multiplyScalar(J){return this.x*=J,this.y*=J,this.z*=J,this.w*=J,this}applyMatrix4(J){let $=this.x,Z=this.y,Q=this.z,W=this.w,X=J.elements;return this.x=X[0]*$+X[4]*Z+X[8]*Q+X[12]*W,this.y=X[1]*$+X[5]*Z+X[9]*Q+X[13]*W,this.z=X[2]*$+X[6]*Z+X[10]*Q+X[14]*W,this.w=X[3]*$+X[7]*Z+X[11]*Q+X[15]*W,this}divideScalar(J){return this.multiplyScalar(1/J)}setAxisAngleFromQuaternion(J){this.w=2*Math.acos(J.w);let $=Math.sqrt(1-J.w*J.w);if($<0.0001)this.x=1,this.y=0,this.z=0;else this.x=J.x/$,this.y=J.y/$,this.z=J.z/$;return this}setAxisAngleFromRotationMatrix(J){let $,Z,Q,W,X=0.01,H=0.1,Y=J.elements,q=Y[0],U=Y[4],K=Y[8],E=Y[1],V=Y[5],O=Y[9],_=Y[2],R=Y[6],F=Y[10];if(Math.abs(U-E)<0.01&&Math.abs(K-_)<0.01&&Math.abs(O-R)<0.01){if(Math.abs(U+E)<0.1&&Math.abs(K+_)<0.1&&Math.abs(O+R)<0.1&&Math.abs(q+V+F-3)<0.1)return this.set(1,0,0,0),this;$=Math.PI;let N=(q+1)/2,z=(V+1)/2,w=(F+1)/2,k=(U+E)/4,L=(K+_)/4,S=(O+R)/4;if(N>z&&N>w)if(N<0.01)Z=0,Q=0.707106781,W=0.707106781;else Z=Math.sqrt(N),Q=k/Z,W=L/Z;else if(z>w)if(z<0.01)Z=0.707106781,Q=0,W=0.707106781;else Q=Math.sqrt(z),Z=k/Q,W=S/Q;else if(w<0.01)Z=0.707106781,Q=0.707106781,W=0;else W=Math.sqrt(w),Z=L/W,Q=S/W;return this.set(Z,Q,W,$),this}let G=Math.sqrt((R-O)*(R-O)+(K-_)*(K-_)+(E-U)*(E-U));if(Math.abs(G)<0.001)G=1;return this.x=(R-O)/G,this.y=(K-_)/G,this.z=(E-U)/G,this.w=Math.acos((q+V+F-1)/2),this}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this.z=Math.min(this.z,J.z),this.w=Math.min(this.w,J.w),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this.z=Math.max(this.z,J.z),this.w=Math.max(this.w,J.w),this}clamp(J,$){return this.x=Math.max(J.x,Math.min($.x,this.x)),this.y=Math.max(J.y,Math.min($.y,this.y)),this.z=Math.max(J.z,Math.min($.z,this.z)),this.w=Math.max(J.w,Math.min($.w,this.w)),this}clampScalar(J,$){return this.x=Math.max(J,Math.min($,this.x)),this.y=Math.max(J,Math.min($,this.y)),this.z=Math.max(J,Math.min($,this.z)),this.w=Math.max(J,Math.min($,this.w)),this}clampLength(J,$){let Z=this.length();return this.divideScalar(Z||1).multiplyScalar(Math.max(J,Math.min($,Z)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(J){return this.x*J.x+this.y*J.y+this.z*J.z+this.w*J.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,$){return this.x+=(J.x-this.x)*$,this.y+=(J.y-this.y)*$,this.z+=(J.z-this.z)*$,this.w+=(J.w-this.w)*$,this}lerpVectors(J,$,Z){return this.x=J.x+($.x-J.x)*Z,this.y=J.y+($.y-J.y)*Z,this.z=J.z+($.z-J.z)*Z,this.w=J.w+($.w-J.w)*Z,this}equals(J){return J.x===this.x&&J.y===this.y&&J.z===this.z&&J.w===this.w}fromArray(J,$=0){return this.x=J[$],this.y=J[$+1],this.z=J[$+2],this.w=J[$+3],this}toArray(J=[],$=0){return J[$]=this.x,J[$+1]=this.y,J[$+2]=this.z,J[$+3]=this.w,J}fromBufferAttribute(J,$){return this.x=J.getX($),this.y=J.getY($),this.z=J.getZ($),this.w=J.getW($),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class rZ extends M9{constructor(J=1,$=1,Z={}){super();this.isRenderTarget=!0,this.width=J,this.height=$,this.depth=1,this.scissor=new J7(0,0,J,$),this.scissorTest=!1,this.viewport=new J7(0,0,J,$);let Q={width:J,height:$,depth:1};if(Z.encoding!==void 0)P$("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),Z.colorSpace=Z.encoding===3001?"srgb":"";Z=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},Z),this.texture=new O7(Q,Z.mapping,Z.wrapS,Z.wrapT,Z.magFilter,Z.minFilter,Z.format,Z.type,Z.anisotropy,Z.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=Z.generateMipmaps,this.texture.internalFormat=Z.internalFormat,this.depthBuffer=Z.depthBuffer,this.stencilBuffer=Z.stencilBuffer,this.depthTexture=Z.depthTexture,this.samples=Z.samples}setSize(J,$,Z=1){if(this.width!==J||this.height!==$||this.depth!==Z)this.width=J,this.height=$,this.depth=Z,this.texture.image.width=J,this.texture.image.height=$,this.texture.image.depth=Z,this.dispose();this.viewport.set(0,0,J,$),this.scissor.set(0,0,J,$)}clone(){return new this.constructor().copy(this)}copy(J){this.width=J.width,this.height=J.height,this.depth=J.depth,this.scissor.copy(J.scissor),this.scissorTest=J.scissorTest,this.viewport.copy(J.viewport),this.texture=J.texture.clone(),this.texture.isRenderTargetTexture=!0;let $=Object.assign({},J.texture.image);if(this.texture.source=new f8($),this.depthBuffer=J.depthBuffer,this.stencilBuffer=J.stencilBuffer,J.depthTexture!==null)this.depthTexture=J.depthTexture.clone();return this.samples=J.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class R9 extends rZ{constructor(J=1,$=1,Z={}){super(J,$,Z);this.isWebGLRenderTarget=!0}}class h8 extends O7{constructor(J=null,$=1,Z=1,Q=1){super(null);this.isDataArrayTexture=!0,this.image={data:J,width:$,height:Z,depth:Q},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class tZ extends O7{constructor(J=null,$=1,Z=1,Q=1){super(null);this.isData3DTexture=!0,this.image={data:J,width:$,height:Z,depth:Q},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class A7{constructor(J=0,$=0,Z=0,Q=1){this.isQuaternion=!0,this._x=J,this._y=$,this._z=Z,this._w=Q}static slerpFlat(J,$,Z,Q,W,X,H){let Y=Z[Q+0],q=Z[Q+1],U=Z[Q+2],K=Z[Q+3],E=W[X+0],V=W[X+1],O=W[X+2],_=W[X+3];if(H===0){J[$+0]=Y,J[$+1]=q,J[$+2]=U,J[$+3]=K;return}if(H===1){J[$+0]=E,J[$+1]=V,J[$+2]=O,J[$+3]=_;return}if(K!==_||Y!==E||q!==V||U!==O){let R=1-H,F=Y*E+q*V+U*O+K*_,G=F>=0?1:-1,N=1-F*F;if(N>Number.EPSILON){let w=Math.sqrt(N),k=Math.atan2(w,F*G);R=Math.sin(R*k)/w,H=Math.sin(H*k)/w}let z=H*G;if(Y=Y*R+E*z,q=q*R+V*z,U=U*R+O*z,K=K*R+_*z,R===1-H){let w=1/Math.sqrt(Y*Y+q*q+U*U+K*K);Y*=w,q*=w,U*=w,K*=w}}J[$]=Y,J[$+1]=q,J[$+2]=U,J[$+3]=K}static multiplyQuaternionsFlat(J,$,Z,Q,W,X){let H=Z[Q],Y=Z[Q+1],q=Z[Q+2],U=Z[Q+3],K=W[X],E=W[X+1],V=W[X+2],O=W[X+3];return J[$]=H*O+U*K+Y*V-q*E,J[$+1]=Y*O+U*E+q*K-H*V,J[$+2]=q*O+U*V+H*E-Y*K,J[$+3]=U*O-H*K-Y*E-q*V,J}get x(){return this._x}set x(J){this._x=J,this._onChangeCallback()}get y(){return this._y}set y(J){this._y=J,this._onChangeCallback()}get z(){return this._z}set z(J){this._z=J,this._onChangeCallback()}get w(){return this._w}set w(J){this._w=J,this._onChangeCallback()}set(J,$,Z,Q){return this._x=J,this._y=$,this._z=Z,this._w=Q,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(J){return this._x=J.x,this._y=J.y,this._z=J.z,this._w=J.w,this._onChangeCallback(),this}setFromEuler(J,$=!0){let{_x:Z,_y:Q,_z:W,_order:X}=J,H=Math.cos,Y=Math.sin,q=H(Z/2),U=H(Q/2),K=H(W/2),E=Y(Z/2),V=Y(Q/2),O=Y(W/2);switch(X){case"XYZ":this._x=E*U*K+q*V*O,this._y=q*V*K-E*U*O,this._z=q*U*O+E*V*K,this._w=q*U*K-E*V*O;break;case"YXZ":this._x=E*U*K+q*V*O,this._y=q*V*K-E*U*O,this._z=q*U*O-E*V*K,this._w=q*U*K+E*V*O;break;case"ZXY":this._x=E*U*K-q*V*O,this._y=q*V*K+E*U*O,this._z=q*U*O+E*V*K,this._w=q*U*K-E*V*O;break;case"ZYX":this._x=E*U*K-q*V*O,this._y=q*V*K+E*U*O,this._z=q*U*O-E*V*K,this._w=q*U*K+E*V*O;break;case"YZX":this._x=E*U*K+q*V*O,this._y=q*V*K+E*U*O,this._z=q*U*O-E*V*K,this._w=q*U*K-E*V*O;break;case"XZY":this._x=E*U*K-q*V*O,this._y=q*V*K-E*U*O,this._z=q*U*O+E*V*K,this._w=q*U*K+E*V*O;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+X)}if($===!0)this._onChangeCallback();return this}setFromAxisAngle(J,$){let Z=$/2,Q=Math.sin(Z);return this._x=J.x*Q,this._y=J.y*Q,this._z=J.z*Q,this._w=Math.cos(Z),this._onChangeCallback(),this}setFromRotationMatrix(J){let $=J.elements,Z=$[0],Q=$[4],W=$[8],X=$[1],H=$[5],Y=$[9],q=$[2],U=$[6],K=$[10],E=Z+H+K;if(E>0){let V=0.5/Math.sqrt(E+1);this._w=0.25/V,this._x=(U-Y)*V,this._y=(W-q)*V,this._z=(X-Q)*V}else if(Z>H&&Z>K){let V=2*Math.sqrt(1+Z-H-K);this._w=(U-Y)/V,this._x=0.25*V,this._y=(Q+X)/V,this._z=(W+q)/V}else if(H>K){let V=2*Math.sqrt(1+H-Z-K);this._w=(W-q)/V,this._x=(Q+X)/V,this._y=0.25*V,this._z=(Y+U)/V}else{let V=2*Math.sqrt(1+K-Z-H);this._w=(X-Q)/V,this._x=(W+q)/V,this._y=(Y+U)/V,this._z=0.25*V}return this._onChangeCallback(),this}setFromUnitVectors(J,$){let Z=J.dot($)+1;if(Z<Number.EPSILON)if(Z=0,Math.abs(J.x)>Math.abs(J.z))this._x=-J.y,this._y=J.x,this._z=0,this._w=Z;else this._x=0,this._y=-J.z,this._z=J.y,this._w=Z;else this._x=J.y*$.z-J.z*$.y,this._y=J.z*$.x-J.x*$.z,this._z=J.x*$.y-J.y*$.x,this._w=Z;return this.normalize()}angleTo(J){return 2*Math.acos(Math.abs(C7(this.dot(J),-1,1)))}rotateTowards(J,$){let Z=this.angleTo(J);if(Z===0)return this;let Q=Math.min(1,$/Z);return this.slerp(J,Q),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(J){return this._x*J._x+this._y*J._y+this._z*J._z+this._w*J._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let J=this.length();if(J===0)this._x=0,this._y=0,this._z=0,this._w=1;else J=1/J,this._x=this._x*J,this._y=this._y*J,this._z=this._z*J,this._w=this._w*J;return this._onChangeCallback(),this}multiply(J){return this.multiplyQuaternions(this,J)}premultiply(J){return this.multiplyQuaternions(J,this)}multiplyQuaternions(J,$){let{_x:Z,_y:Q,_z:W,_w:X}=J,H=$._x,Y=$._y,q=$._z,U=$._w;return this._x=Z*U+X*H+Q*q-W*Y,this._y=Q*U+X*Y+W*H-Z*q,this._z=W*U+X*q+Z*Y-Q*H,this._w=X*U-Z*H-Q*Y-W*q,this._onChangeCallback(),this}slerp(J,$){if($===0)return this;if($===1)return this.copy(J);let Z=this._x,Q=this._y,W=this._z,X=this._w,H=X*J._w+Z*J._x+Q*J._y+W*J._z;if(H<0)this._w=-J._w,this._x=-J._x,this._y=-J._y,this._z=-J._z,H=-H;else this.copy(J);if(H>=1)return this._w=X,this._x=Z,this._y=Q,this._z=W,this;let Y=1-H*H;if(Y<=Number.EPSILON){let V=1-$;return this._w=V*X+$*this._w,this._x=V*Z+$*this._x,this._y=V*Q+$*this._y,this._z=V*W+$*this._z,this.normalize(),this}let q=Math.sqrt(Y),U=Math.atan2(q,H),K=Math.sin((1-$)*U)/q,E=Math.sin($*U)/q;return this._w=X*K+this._w*E,this._x=Z*K+this._x*E,this._y=Q*K+this._y*E,this._z=W*K+this._z*E,this._onChangeCallback(),this}slerpQuaternions(J,$,Z){return this.copy(J).slerp($,Z)}random(){let J=Math.random(),$=Math.sqrt(1-J),Z=Math.sqrt(J),Q=2*Math.PI*Math.random(),W=2*Math.PI*Math.random();return this.set($*Math.cos(Q),Z*Math.sin(W),Z*Math.cos(W),$*Math.sin(Q))}equals(J){return J._x===this._x&&J._y===this._y&&J._z===this._z&&J._w===this._w}fromArray(J,$=0){return this._x=J[$],this._y=J[$+1],this._z=J[$+2],this._w=J[$+3],this._onChangeCallback(),this}toArray(J=[],$=0){return J[$]=this._x,J[$+1]=this._y,J[$+2]=this._z,J[$+3]=this._w,J}fromBufferAttribute(J,$){return this._x=J.getX($),this._y=J.getY($),this._z=J.getZ($),this._w=J.getW($),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(J){return this._onChangeCallback=J,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class T{constructor(J=0,$=0,Z=0){T.prototype.isVector3=!0,this.x=J,this.y=$,this.z=Z}set(J,$,Z){if(Z===void 0)Z=this.z;return this.x=J,this.y=$,this.z=Z,this}setScalar(J){return this.x=J,this.y=J,this.z=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setZ(J){return this.z=J,this}setComponent(J,$){switch(J){case 0:this.x=$;break;case 1:this.y=$;break;case 2:this.z=$;break;default:throw Error("index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error("index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(J){return this.x=J.x,this.y=J.y,this.z=J.z,this}add(J){return this.x+=J.x,this.y+=J.y,this.z+=J.z,this}addScalar(J){return this.x+=J,this.y+=J,this.z+=J,this}addVectors(J,$){return this.x=J.x+$.x,this.y=J.y+$.y,this.z=J.z+$.z,this}addScaledVector(J,$){return this.x+=J.x*$,this.y+=J.y*$,this.z+=J.z*$,this}sub(J){return this.x-=J.x,this.y-=J.y,this.z-=J.z,this}subScalar(J){return this.x-=J,this.y-=J,this.z-=J,this}subVectors(J,$){return this.x=J.x-$.x,this.y=J.y-$.y,this.z=J.z-$.z,this}multiply(J){return this.x*=J.x,this.y*=J.y,this.z*=J.z,this}multiplyScalar(J){return this.x*=J,this.y*=J,this.z*=J,this}multiplyVectors(J,$){return this.x=J.x*$.x,this.y=J.y*$.y,this.z=J.z*$.z,this}applyEuler(J){return this.applyQuaternion(p6.setFromEuler(J))}applyAxisAngle(J,$){return this.applyQuaternion(p6.setFromAxisAngle(J,$))}applyMatrix3(J){let $=this.x,Z=this.y,Q=this.z,W=J.elements;return this.x=W[0]*$+W[3]*Z+W[6]*Q,this.y=W[1]*$+W[4]*Z+W[7]*Q,this.z=W[2]*$+W[5]*Z+W[8]*Q,this}applyNormalMatrix(J){return this.applyMatrix3(J).normalize()}applyMatrix4(J){let $=this.x,Z=this.y,Q=this.z,W=J.elements,X=1/(W[3]*$+W[7]*Z+W[11]*Q+W[15]);return this.x=(W[0]*$+W[4]*Z+W[8]*Q+W[12])*X,this.y=(W[1]*$+W[5]*Z+W[9]*Q+W[13])*X,this.z=(W[2]*$+W[6]*Z+W[10]*Q+W[14])*X,this}applyQuaternion(J){let $=this.x,Z=this.y,Q=this.z,W=J.x,X=J.y,H=J.z,Y=J.w,q=2*(X*Q-H*Z),U=2*(H*$-W*Q),K=2*(W*Z-X*$);return this.x=$+Y*q+X*K-H*U,this.y=Z+Y*U+H*q-W*K,this.z=Q+Y*K+W*U-X*q,this}project(J){return this.applyMatrix4(J.matrixWorldInverse).applyMatrix4(J.projectionMatrix)}unproject(J){return this.applyMatrix4(J.projectionMatrixInverse).applyMatrix4(J.matrixWorld)}transformDirection(J){let $=this.x,Z=this.y,Q=this.z,W=J.elements;return this.x=W[0]*$+W[4]*Z+W[8]*Q,this.y=W[1]*$+W[5]*Z+W[9]*Q,this.z=W[2]*$+W[6]*Z+W[10]*Q,this.normalize()}divide(J){return this.x/=J.x,this.y/=J.y,this.z/=J.z,this}divideScalar(J){return this.multiplyScalar(1/J)}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this.z=Math.min(this.z,J.z),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this.z=Math.max(this.z,J.z),this}clamp(J,$){return this.x=Math.max(J.x,Math.min($.x,this.x)),this.y=Math.max(J.y,Math.min($.y,this.y)),this.z=Math.max(J.z,Math.min($.z,this.z)),this}clampScalar(J,$){return this.x=Math.max(J,Math.min($,this.x)),this.y=Math.max(J,Math.min($,this.y)),this.z=Math.max(J,Math.min($,this.z)),this}clampLength(J,$){let Z=this.length();return this.divideScalar(Z||1).multiplyScalar(Math.max(J,Math.min($,Z)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(J){return this.x*J.x+this.y*J.y+this.z*J.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,$){return this.x+=(J.x-this.x)*$,this.y+=(J.y-this.y)*$,this.z+=(J.z-this.z)*$,this}lerpVectors(J,$,Z){return this.x=J.x+($.x-J.x)*Z,this.y=J.y+($.y-J.y)*Z,this.z=J.z+($.z-J.z)*Z,this}cross(J){return this.crossVectors(this,J)}crossVectors(J,$){let{x:Z,y:Q,z:W}=J,X=$.x,H=$.y,Y=$.z;return this.x=Q*Y-W*H,this.y=W*X-Z*Y,this.z=Z*H-Q*X,this}projectOnVector(J){let $=J.lengthSq();if($===0)return this.set(0,0,0);let Z=J.dot(this)/$;return this.copy(J).multiplyScalar(Z)}projectOnPlane(J){return Q8.copy(this).projectOnVector(J),this.sub(Q8)}reflect(J){return this.sub(Q8.copy(J).multiplyScalar(2*this.dot(J)))}angleTo(J){let $=Math.sqrt(this.lengthSq()*J.lengthSq());if($===0)return Math.PI/2;let Z=this.dot(J)/$;return Math.acos(C7(Z,-1,1))}distanceTo(J){return Math.sqrt(this.distanceToSquared(J))}distanceToSquared(J){let $=this.x-J.x,Z=this.y-J.y,Q=this.z-J.z;return $*$+Z*Z+Q*Q}manhattanDistanceTo(J){return Math.abs(this.x-J.x)+Math.abs(this.y-J.y)+Math.abs(this.z-J.z)}setFromSpherical(J){return this.setFromSphericalCoords(J.radius,J.phi,J.theta)}setFromSphericalCoords(J,$,Z){let Q=Math.sin($)*J;return this.x=Q*Math.sin(Z),this.y=Math.cos($)*J,this.z=Q*Math.cos(Z),this}setFromCylindrical(J){return this.setFromCylindricalCoords(J.radius,J.theta,J.y)}setFromCylindricalCoords(J,$,Z){return this.x=J*Math.sin($),this.y=Z,this.z=J*Math.cos($),this}setFromMatrixPosition(J){let $=J.elements;return this.x=$[12],this.y=$[13],this.z=$[14],this}setFromMatrixScale(J){let $=this.setFromMatrixColumn(J,0).length(),Z=this.setFromMatrixColumn(J,1).length(),Q=this.setFromMatrixColumn(J,2).length();return this.x=$,this.y=Z,this.z=Q,this}setFromMatrixColumn(J,$){return this.fromArray(J.elements,$*4)}setFromMatrix3Column(J,$){return this.fromArray(J.elements,$*3)}setFromEuler(J){return this.x=J._x,this.y=J._y,this.z=J._z,this}setFromColor(J){return this.x=J.r,this.y=J.g,this.z=J.b,this}equals(J){return J.x===this.x&&J.y===this.y&&J.z===this.z}fromArray(J,$=0){return this.x=J[$],this.y=J[$+1],this.z=J[$+2],this}toArray(J=[],$=0){return J[$]=this.x,J[$+1]=this.y,J[$+2]=this.z,J}fromBufferAttribute(J,$){return this.x=J.getX($),this.y=J.getY($),this.z=J.getZ($),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let J=(Math.random()-0.5)*2,$=Math.random()*Math.PI*2,Z=Math.sqrt(1-J**2);return this.x=Z*Math.cos($),this.y=Z*Math.sin($),this.z=J,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var Q8=new T,p6=new A7;class y7{constructor(J=new T(1/0,1/0,1/0),$=new T(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=J,this.max=$}set(J,$){return this.min.copy(J),this.max.copy($),this}setFromArray(J){this.makeEmpty();for(let $=0,Z=J.length;$<Z;$+=3)this.expandByPoint(u7.fromArray(J,$));return this}setFromBufferAttribute(J){this.makeEmpty();for(let $=0,Z=J.count;$<Z;$++)this.expandByPoint(u7.fromBufferAttribute(J,$));return this}setFromPoints(J){this.makeEmpty();for(let $=0,Z=J.length;$<Z;$++)this.expandByPoint(J[$]);return this}setFromCenterAndSize(J,$){let Z=u7.copy($).multiplyScalar(0.5);return this.min.copy(J).sub(Z),this.max.copy(J).add(Z),this}setFromObject(J,$=!1){return this.makeEmpty(),this.expandByObject(J,$)}clone(){return new this.constructor().copy(this)}copy(J){return this.min.copy(J.min),this.max.copy(J.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(J){return this.isEmpty()?J.set(0,0,0):J.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(J){return this.isEmpty()?J.set(0,0,0):J.subVectors(this.max,this.min)}expandByPoint(J){return this.min.min(J),this.max.max(J),this}expandByVector(J){return this.min.sub(J),this.max.add(J),this}expandByScalar(J){return this.min.addScalar(-J),this.max.addScalar(J),this}expandByObject(J,$=!1){J.updateWorldMatrix(!1,!1);let Z=J.geometry;if(Z!==void 0){let W=Z.getAttribute("position");if($===!0&&W!==void 0&&J.isInstancedMesh!==!0)for(let X=0,H=W.count;X<H;X++){if(J.isMesh===!0)J.getVertexPosition(X,u7);else u7.fromBufferAttribute(W,X);u7.applyMatrix4(J.matrixWorld),this.expandByPoint(u7)}else{if(J.boundingBox!==void 0){if(J.boundingBox===null)J.computeBoundingBox();$0.copy(J.boundingBox)}else{if(Z.boundingBox===null)Z.computeBoundingBox();$0.copy(Z.boundingBox)}$0.applyMatrix4(J.matrixWorld),this.union($0)}}let Q=J.children;for(let W=0,X=Q.length;W<X;W++)this.expandByObject(Q[W],$);return this}containsPoint(J){return J.x<this.min.x||J.x>this.max.x||J.y<this.min.y||J.y>this.max.y||J.z<this.min.z||J.z>this.max.z?!1:!0}containsBox(J){return this.min.x<=J.min.x&&J.max.x<=this.max.x&&this.min.y<=J.min.y&&J.max.y<=this.max.y&&this.min.z<=J.min.z&&J.max.z<=this.max.z}getParameter(J,$){return $.set((J.x-this.min.x)/(this.max.x-this.min.x),(J.y-this.min.y)/(this.max.y-this.min.y),(J.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(J){return J.max.x<this.min.x||J.min.x>this.max.x||J.max.y<this.min.y||J.min.y>this.max.y||J.max.z<this.min.z||J.min.z>this.max.z?!1:!0}intersectsSphere(J){return this.clampPoint(J.center,u7),u7.distanceToSquared(J.center)<=J.radius*J.radius}intersectsPlane(J){let $,Z;if(J.normal.x>0)$=J.normal.x*this.min.x,Z=J.normal.x*this.max.x;else $=J.normal.x*this.max.x,Z=J.normal.x*this.min.x;if(J.normal.y>0)$+=J.normal.y*this.min.y,Z+=J.normal.y*this.max.y;else $+=J.normal.y*this.max.y,Z+=J.normal.y*this.min.y;if(J.normal.z>0)$+=J.normal.z*this.min.z,Z+=J.normal.z*this.max.z;else $+=J.normal.z*this.max.z,Z+=J.normal.z*this.min.z;return $<=-J.constant&&Z>=-J.constant}intersectsTriangle(J){if(this.isEmpty())return!1;this.getCenter(z$),Z0.subVectors(this.max,z$),l9.subVectors(J.a,z$),u9.subVectors(J.b,z$),m9.subVectors(J.c,z$),U9.subVectors(u9,l9),K9.subVectors(m9,u9),k9.subVectors(l9,m9);let $=[0,-U9.z,U9.y,0,-K9.z,K9.y,0,-k9.z,k9.y,U9.z,0,-U9.x,K9.z,0,-K9.x,k9.z,0,-k9.x,-U9.y,U9.x,0,-K9.y,K9.x,0,-k9.y,k9.x,0];if(!W8($,l9,u9,m9,Z0))return!1;if($=[1,0,0,0,1,0,0,0,1],!W8($,l9,u9,m9,Z0))return!1;return Q0.crossVectors(U9,K9),$=[Q0.x,Q0.y,Q0.z],W8($,l9,u9,m9,Z0)}clampPoint(J,$){return $.copy(J).clamp(this.min,this.max)}distanceToPoint(J){return this.clampPoint(J,u7).distanceTo(J)}getBoundingSphere(J){if(this.isEmpty())J.makeEmpty();else this.getCenter(J.center),J.radius=this.getSize(u7).length()*0.5;return J}intersect(J){if(this.min.max(J.min),this.max.min(J.max),this.isEmpty())this.makeEmpty();return this}union(J){return this.min.min(J.min),this.max.max(J.max),this}applyMatrix4(J){if(this.isEmpty())return this;return Z9[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(J),Z9[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(J),Z9[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(J),Z9[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(J),Z9[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(J),Z9[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(J),Z9[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(J),Z9[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(J),this.setFromPoints(Z9),this}translate(J){return this.min.add(J),this.max.add(J),this}equals(J){return J.min.equals(this.min)&&J.max.equals(this.max)}}var Z9=[new T,new T,new T,new T,new T,new T,new T,new T],u7=new T,$0=new y7,l9=new T,u9=new T,m9=new T,U9=new T,K9=new T,k9=new T,z$=new T,Z0=new T,Q0=new T,P9=new T;function W8(J,$,Z,Q,W){for(let X=0,H=J.length-3;X<=H;X+=3){P9.fromArray(J,X);let Y=W.x*Math.abs(P9.x)+W.y*Math.abs(P9.y)+W.z*Math.abs(P9.z),q=$.dot(P9),U=Z.dot(P9),K=Q.dot(P9);if(Math.max(-Math.max(q,U,K),Math.min(q,U,K))>Y)return!1}return!0}var eQ=new y7,M$=new T,X8=new T;class g7{constructor(J=new T,$=-1){this.isSphere=!0,this.center=J,this.radius=$}set(J,$){return this.center.copy(J),this.radius=$,this}setFromPoints(J,$){let Z=this.center;if($!==void 0)Z.copy($);else eQ.setFromPoints(J).getCenter(Z);let Q=0;for(let W=0,X=J.length;W<X;W++)Q=Math.max(Q,Z.distanceToSquared(J[W]));return this.radius=Math.sqrt(Q),this}copy(J){return this.center.copy(J.center),this.radius=J.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(J){return J.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(J){return J.distanceTo(this.center)-this.radius}intersectsSphere(J){let $=this.radius+J.radius;return J.center.distanceToSquared(this.center)<=$*$}intersectsBox(J){return J.intersectsSphere(this)}intersectsPlane(J){return Math.abs(J.distanceToPoint(this.center))<=this.radius}clampPoint(J,$){let Z=this.center.distanceToSquared(J);if($.copy(J),Z>this.radius*this.radius)$.sub(this.center).normalize(),$.multiplyScalar(this.radius).add(this.center);return $}getBoundingBox(J){if(this.isEmpty())return J.makeEmpty(),J;return J.set(this.center,this.center),J.expandByScalar(this.radius),J}applyMatrix4(J){return this.center.applyMatrix4(J),this.radius=this.radius*J.getMaxScaleOnAxis(),this}translate(J){return this.center.add(J),this}expandByPoint(J){if(this.isEmpty())return this.center.copy(J),this.radius=0,this;M$.subVectors(J,this.center);let $=M$.lengthSq();if($>this.radius*this.radius){let Z=Math.sqrt($),Q=(Z-this.radius)*0.5;this.center.addScaledVector(M$,Q/Z),this.radius+=Q}return this}union(J){if(J.isEmpty())return this;if(this.isEmpty())return this.copy(J),this;if(this.center.equals(J.center)===!0)this.radius=Math.max(this.radius,J.radius);else X8.subVectors(J.center,this.center).setLength(J.radius),this.expandByPoint(M$.copy(J.center).add(X8)),this.expandByPoint(M$.copy(J.center).sub(X8));return this}equals(J){return J.center.equals(this.center)&&J.radius===this.radius}clone(){return new this.constructor().copy(this)}}var Q9=new T,Y8=new T,W0=new T,E9=new T,H8=new T,X0=new T,q8=new T;class x${constructor(J=new T,$=new T(0,0,-1)){this.origin=J,this.direction=$}set(J,$){return this.origin.copy(J),this.direction.copy($),this}copy(J){return this.origin.copy(J.origin),this.direction.copy(J.direction),this}at(J,$){return $.copy(this.origin).addScaledVector(this.direction,J)}lookAt(J){return this.direction.copy(J).sub(this.origin).normalize(),this}recast(J){return this.origin.copy(this.at(J,Q9)),this}closestPointToPoint(J,$){$.subVectors(J,this.origin);let Z=$.dot(this.direction);if(Z<0)return $.copy(this.origin);return $.copy(this.origin).addScaledVector(this.direction,Z)}distanceToPoint(J){return Math.sqrt(this.distanceSqToPoint(J))}distanceSqToPoint(J){let $=Q9.subVectors(J,this.origin).dot(this.direction);if($<0)return this.origin.distanceToSquared(J);return Q9.copy(this.origin).addScaledVector(this.direction,$),Q9.distanceToSquared(J)}distanceSqToSegment(J,$,Z,Q){Y8.copy(J).add($).multiplyScalar(0.5),W0.copy($).sub(J).normalize(),E9.copy(this.origin).sub(Y8);let W=J.distanceTo($)*0.5,X=-this.direction.dot(W0),H=E9.dot(this.direction),Y=-E9.dot(W0),q=E9.lengthSq(),U=Math.abs(1-X*X),K,E,V,O;if(U>0)if(K=X*Y-H,E=X*H-Y,O=W*U,K>=0)if(E>=-O)if(E<=O){let _=1/U;K*=_,E*=_,V=K*(K+X*E+2*H)+E*(X*K+E+2*Y)+q}else E=W,K=Math.max(0,-(X*E+H)),V=-K*K+E*(E+2*Y)+q;else E=-W,K=Math.max(0,-(X*E+H)),V=-K*K+E*(E+2*Y)+q;else if(E<=-O)K=Math.max(0,-(-X*W+H)),E=K>0?-W:Math.min(Math.max(-W,-Y),W),V=-K*K+E*(E+2*Y)+q;else if(E<=O)K=0,E=Math.min(Math.max(-W,-Y),W),V=E*(E+2*Y)+q;else K=Math.max(0,-(X*W+H)),E=K>0?W:Math.min(Math.max(-W,-Y),W),V=-K*K+E*(E+2*Y)+q;else E=X>0?-W:W,K=Math.max(0,-(X*E+H)),V=-K*K+E*(E+2*Y)+q;if(Z)Z.copy(this.origin).addScaledVector(this.direction,K);if(Q)Q.copy(Y8).addScaledVector(W0,E);return V}intersectSphere(J,$){Q9.subVectors(J.center,this.origin);let Z=Q9.dot(this.direction),Q=Q9.dot(Q9)-Z*Z,W=J.radius*J.radius;if(Q>W)return null;let X=Math.sqrt(W-Q),H=Z-X,Y=Z+X;if(Y<0)return null;if(H<0)return this.at(Y,$);return this.at(H,$)}intersectsSphere(J){return this.distanceSqToPoint(J.center)<=J.radius*J.radius}distanceToPlane(J){let $=J.normal.dot(this.direction);if($===0){if(J.distanceToPoint(this.origin)===0)return 0;return null}let Z=-(this.origin.dot(J.normal)+J.constant)/$;return Z>=0?Z:null}intersectPlane(J,$){let Z=this.distanceToPlane(J);if(Z===null)return null;return this.at(Z,$)}intersectsPlane(J){let $=J.distanceToPoint(this.origin);if($===0)return!0;if(J.normal.dot(this.direction)*$<0)return!0;return!1}intersectBox(J,$){let Z,Q,W,X,H,Y,q=1/this.direction.x,U=1/this.direction.y,K=1/this.direction.z,E=this.origin;if(q>=0)Z=(J.min.x-E.x)*q,Q=(J.max.x-E.x)*q;else Z=(J.max.x-E.x)*q,Q=(J.min.x-E.x)*q;if(U>=0)W=(J.min.y-E.y)*U,X=(J.max.y-E.y)*U;else W=(J.max.y-E.y)*U,X=(J.min.y-E.y)*U;if(Z>X||W>Q)return null;if(W>Z||isNaN(Z))Z=W;if(X<Q||isNaN(Q))Q=X;if(K>=0)H=(J.min.z-E.z)*K,Y=(J.max.z-E.z)*K;else H=(J.max.z-E.z)*K,Y=(J.min.z-E.z)*K;if(Z>Y||H>Q)return null;if(H>Z||Z!==Z)Z=H;if(Y<Q||Q!==Q)Q=Y;if(Q<0)return null;return this.at(Z>=0?Z:Q,$)}intersectsBox(J){return this.intersectBox(J,Q9)!==null}intersectTriangle(J,$,Z,Q,W){H8.subVectors($,J),X0.subVectors(Z,J),q8.crossVectors(H8,X0);let X=this.direction.dot(q8),H;if(X>0){if(Q)return null;H=1}else if(X<0)H=-1,X=-X;else return null;E9.subVectors(this.origin,J);let Y=H*this.direction.dot(X0.crossVectors(E9,X0));if(Y<0)return null;let q=H*this.direction.dot(H8.cross(E9));if(q<0)return null;if(Y+q>X)return null;let U=-H*E9.dot(q8);if(U<0)return null;return this.at(U/X,W)}applyMatrix4(J){return this.origin.applyMatrix4(J),this.direction.transformDirection(J),this}equals(J){return J.origin.equals(this.origin)&&J.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class AJ{constructor(J,$,Z,Q,W,X,H,Y,q,U,K,E,V,O,_,R){if(AJ.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],J!==void 0)this.set(J,$,Z,Q,W,X,H,Y,q,U,K,E,V,O,_,R)}set(J,$,Z,Q,W,X,H,Y,q,U,K,E,V,O,_,R){let F=this.elements;return F[0]=J,F[4]=$,F[8]=Z,F[12]=Q,F[1]=W,F[5]=X,F[9]=H,F[13]=Y,F[2]=q,F[6]=U,F[10]=K,F[14]=E,F[3]=V,F[7]=O,F[11]=_,F[15]=R,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new AJ().fromArray(this.elements)}copy(J){let $=this.elements,Z=J.elements;return $[0]=Z[0],$[1]=Z[1],$[2]=Z[2],$[3]=Z[3],$[4]=Z[4],$[5]=Z[5],$[6]=Z[6],$[7]=Z[7],$[8]=Z[8],$[9]=Z[9],$[10]=Z[10],$[11]=Z[11],$[12]=Z[12],$[13]=Z[13],$[14]=Z[14],$[15]=Z[15],this}copyPosition(J){let $=this.elements,Z=J.elements;return $[12]=Z[12],$[13]=Z[13],$[14]=Z[14],this}setFromMatrix3(J){let $=J.elements;return this.set($[0],$[3],$[6],0,$[1],$[4],$[7],0,$[2],$[5],$[8],0,0,0,0,1),this}extractBasis(J,$,Z){return J.setFromMatrixColumn(this,0),$.setFromMatrixColumn(this,1),Z.setFromMatrixColumn(this,2),this}makeBasis(J,$,Z){return this.set(J.x,$.x,Z.x,0,J.y,$.y,Z.y,0,J.z,$.z,Z.z,0,0,0,0,1),this}extractRotation(J){let $=this.elements,Z=J.elements,Q=1/d9.setFromMatrixColumn(J,0).length(),W=1/d9.setFromMatrixColumn(J,1).length(),X=1/d9.setFromMatrixColumn(J,2).length();return $[0]=Z[0]*Q,$[1]=Z[1]*Q,$[2]=Z[2]*Q,$[3]=0,$[4]=Z[4]*W,$[5]=Z[5]*W,$[6]=Z[6]*W,$[7]=0,$[8]=Z[8]*X,$[9]=Z[9]*X,$[10]=Z[10]*X,$[11]=0,$[12]=0,$[13]=0,$[14]=0,$[15]=1,this}makeRotationFromEuler(J){let $=this.elements,Z=J.x,Q=J.y,W=J.z,X=Math.cos(Z),H=Math.sin(Z),Y=Math.cos(Q),q=Math.sin(Q),U=Math.cos(W),K=Math.sin(W);if(J.order==="XYZ"){let E=X*U,V=X*K,O=H*U,_=H*K;$[0]=Y*U,$[4]=-Y*K,$[8]=q,$[1]=V+O*q,$[5]=E-_*q,$[9]=-H*Y,$[2]=_-E*q,$[6]=O+V*q,$[10]=X*Y}else if(J.order==="YXZ"){let E=Y*U,V=Y*K,O=q*U,_=q*K;$[0]=E+_*H,$[4]=O*H-V,$[8]=X*q,$[1]=X*K,$[5]=X*U,$[9]=-H,$[2]=V*H-O,$[6]=_+E*H,$[10]=X*Y}else if(J.order==="ZXY"){let E=Y*U,V=Y*K,O=q*U,_=q*K;$[0]=E-_*H,$[4]=-X*K,$[8]=O+V*H,$[1]=V+O*H,$[5]=X*U,$[9]=_-E*H,$[2]=-X*q,$[6]=H,$[10]=X*Y}else if(J.order==="ZYX"){let E=X*U,V=X*K,O=H*U,_=H*K;$[0]=Y*U,$[4]=O*q-V,$[8]=E*q+_,$[1]=Y*K,$[5]=_*q+E,$[9]=V*q-O,$[2]=-q,$[6]=H*Y,$[10]=X*Y}else if(J.order==="YZX"){let E=X*Y,V=X*q,O=H*Y,_=H*q;$[0]=Y*U,$[4]=_-E*K,$[8]=O*K+V,$[1]=K,$[5]=X*U,$[9]=-H*U,$[2]=-q*U,$[6]=V*K+O,$[10]=E-_*K}else if(J.order==="XZY"){let E=X*Y,V=X*q,O=H*Y,_=H*q;$[0]=Y*U,$[4]=-K,$[8]=q*U,$[1]=E*K+_,$[5]=X*U,$[9]=V*K-O,$[2]=O*K-V,$[6]=H*U,$[10]=_*K+E}return $[3]=0,$[7]=0,$[11]=0,$[12]=0,$[13]=0,$[14]=0,$[15]=1,this}makeRotationFromQuaternion(J){return this.compose(JW,J,$W)}lookAt(J,$,Z){let Q=this.elements;if(j7.subVectors(J,$),j7.lengthSq()===0)j7.z=1;if(j7.normalize(),V9.crossVectors(Z,j7),V9.lengthSq()===0){if(Math.abs(Z.z)===1)j7.x+=0.0001;else j7.z+=0.0001;j7.normalize(),V9.crossVectors(Z,j7)}return V9.normalize(),Y0.crossVectors(j7,V9),Q[0]=V9.x,Q[4]=Y0.x,Q[8]=j7.x,Q[1]=V9.y,Q[5]=Y0.y,Q[9]=j7.y,Q[2]=V9.z,Q[6]=Y0.z,Q[10]=j7.z,this}multiply(J){return this.multiplyMatrices(this,J)}premultiply(J){return this.multiplyMatrices(J,this)}multiplyMatrices(J,$){let Z=J.elements,Q=$.elements,W=this.elements,X=Z[0],H=Z[4],Y=Z[8],q=Z[12],U=Z[1],K=Z[5],E=Z[9],V=Z[13],O=Z[2],_=Z[6],R=Z[10],F=Z[14],G=Z[3],N=Z[7],z=Z[11],w=Z[15],k=Q[0],L=Q[4],S=Q[8],g=Q[12],B=Q[1],I=Q[5],y=Q[9],c=Q[13],ZJ=Q[2],A=Q[6],l=Q[10],m=Q[14],a=Q[3],d=Q[7],u=Q[11],t=Q[15];return W[0]=X*k+H*B+Y*ZJ+q*a,W[4]=X*L+H*I+Y*A+q*d,W[8]=X*S+H*y+Y*l+q*u,W[12]=X*g+H*c+Y*m+q*t,W[1]=U*k+K*B+E*ZJ+V*a,W[5]=U*L+K*I+E*A+V*d,W[9]=U*S+K*y+E*l+V*u,W[13]=U*g+K*c+E*m+V*t,W[2]=O*k+_*B+R*ZJ+F*a,W[6]=O*L+_*I+R*A+F*d,W[10]=O*S+_*y+R*l+F*u,W[14]=O*g+_*c+R*m+F*t,W[3]=G*k+N*B+z*ZJ+w*a,W[7]=G*L+N*I+z*A+w*d,W[11]=G*S+N*y+z*l+w*u,W[15]=G*g+N*c+z*m+w*t,this}multiplyScalar(J){let $=this.elements;return $[0]*=J,$[4]*=J,$[8]*=J,$[12]*=J,$[1]*=J,$[5]*=J,$[9]*=J,$[13]*=J,$[2]*=J,$[6]*=J,$[10]*=J,$[14]*=J,$[3]*=J,$[7]*=J,$[11]*=J,$[15]*=J,this}determinant(){let J=this.elements,$=J[0],Z=J[4],Q=J[8],W=J[12],X=J[1],H=J[5],Y=J[9],q=J[13],U=J[2],K=J[6],E=J[10],V=J[14],O=J[3],_=J[7],R=J[11],F=J[15];return O*(+W*Y*K-Q*q*K-W*H*E+Z*q*E+Q*H*V-Z*Y*V)+_*(+$*Y*V-$*q*E+W*X*E-Q*X*V+Q*q*U-W*Y*U)+R*(+$*q*K-$*H*V-W*X*K+Z*X*V+W*H*U-Z*q*U)+F*(-Q*H*U-$*Y*K+$*H*E+Q*X*K-Z*X*E+Z*Y*U)}transpose(){let J=this.elements,$;return $=J[1],J[1]=J[4],J[4]=$,$=J[2],J[2]=J[8],J[8]=$,$=J[6],J[6]=J[9],J[9]=$,$=J[3],J[3]=J[12],J[12]=$,$=J[7],J[7]=J[13],J[13]=$,$=J[11],J[11]=J[14],J[14]=$,this}setPosition(J,$,Z){let Q=this.elements;if(J.isVector3)Q[12]=J.x,Q[13]=J.y,Q[14]=J.z;else Q[12]=J,Q[13]=$,Q[14]=Z;return this}invert(){let J=this.elements,$=J[0],Z=J[1],Q=J[2],W=J[3],X=J[4],H=J[5],Y=J[6],q=J[7],U=J[8],K=J[9],E=J[10],V=J[11],O=J[12],_=J[13],R=J[14],F=J[15],G=K*R*q-_*E*q+_*Y*V-H*R*V-K*Y*F+H*E*F,N=O*E*q-U*R*q-O*Y*V+X*R*V+U*Y*F-X*E*F,z=U*_*q-O*K*q+O*H*V-X*_*V-U*H*F+X*K*F,w=O*K*Y-U*_*Y-O*H*E+X*_*E+U*H*R-X*K*R,k=$*G+Z*N+Q*z+W*w;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let L=1/k;return J[0]=G*L,J[1]=(_*E*W-K*R*W-_*Q*V+Z*R*V+K*Q*F-Z*E*F)*L,J[2]=(H*R*W-_*Y*W+_*Q*q-Z*R*q-H*Q*F+Z*Y*F)*L,J[3]=(K*Y*W-H*E*W-K*Q*q+Z*E*q+H*Q*V-Z*Y*V)*L,J[4]=N*L,J[5]=(U*R*W-O*E*W+O*Q*V-$*R*V-U*Q*F+$*E*F)*L,J[6]=(O*Y*W-X*R*W-O*Q*q+$*R*q+X*Q*F-$*Y*F)*L,J[7]=(X*E*W-U*Y*W+U*Q*q-$*E*q-X*Q*V+$*Y*V)*L,J[8]=z*L,J[9]=(O*K*W-U*_*W-O*Z*V+$*_*V+U*Z*F-$*K*F)*L,J[10]=(X*_*W-O*H*W+O*Z*q-$*_*q-X*Z*F+$*H*F)*L,J[11]=(U*H*W-X*K*W-U*Z*q+$*K*q+X*Z*V-$*H*V)*L,J[12]=w*L,J[13]=(U*_*Q-O*K*Q+O*Z*E-$*_*E-U*Z*R+$*K*R)*L,J[14]=(O*H*Q-X*_*Q-O*Z*Y+$*_*Y+X*Z*R-$*H*R)*L,J[15]=(X*K*Q-U*H*Q+U*Z*Y-$*K*Y-X*Z*E+$*H*E)*L,this}scale(J){let $=this.elements,Z=J.x,Q=J.y,W=J.z;return $[0]*=Z,$[4]*=Q,$[8]*=W,$[1]*=Z,$[5]*=Q,$[9]*=W,$[2]*=Z,$[6]*=Q,$[10]*=W,$[3]*=Z,$[7]*=Q,$[11]*=W,this}getMaxScaleOnAxis(){let J=this.elements,$=J[0]*J[0]+J[1]*J[1]+J[2]*J[2],Z=J[4]*J[4]+J[5]*J[5]+J[6]*J[6],Q=J[8]*J[8]+J[9]*J[9]+J[10]*J[10];return Math.sqrt(Math.max($,Z,Q))}makeTranslation(J,$,Z){if(J.isVector3)this.set(1,0,0,J.x,0,1,0,J.y,0,0,1,J.z,0,0,0,1);else this.set(1,0,0,J,0,1,0,$,0,0,1,Z,0,0,0,1);return this}makeRotationX(J){let $=Math.cos(J),Z=Math.sin(J);return this.set(1,0,0,0,0,$,-Z,0,0,Z,$,0,0,0,0,1),this}makeRotationY(J){let $=Math.cos(J),Z=Math.sin(J);return this.set($,0,Z,0,0,1,0,0,-Z,0,$,0,0,0,0,1),this}makeRotationZ(J){let $=Math.cos(J),Z=Math.sin(J);return this.set($,-Z,0,0,Z,$,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(J,$){let Z=Math.cos($),Q=Math.sin($),W=1-Z,X=J.x,H=J.y,Y=J.z,q=W*X,U=W*H;return this.set(q*X+Z,q*H-Q*Y,q*Y+Q*H,0,q*H+Q*Y,U*H+Z,U*Y-Q*X,0,q*Y-Q*H,U*Y+Q*X,W*Y*Y+Z,0,0,0,0,1),this}makeScale(J,$,Z){return this.set(J,0,0,0,0,$,0,0,0,0,Z,0,0,0,0,1),this}makeShear(J,$,Z,Q,W,X){return this.set(1,Z,W,0,J,1,X,0,$,Q,1,0,0,0,0,1),this}compose(J,$,Z){let Q=this.elements,W=$._x,X=$._y,H=$._z,Y=$._w,q=W+W,U=X+X,K=H+H,E=W*q,V=W*U,O=W*K,_=X*U,R=X*K,F=H*K,G=Y*q,N=Y*U,z=Y*K,w=Z.x,k=Z.y,L=Z.z;return Q[0]=(1-(_+F))*w,Q[1]=(V+z)*w,Q[2]=(O-N)*w,Q[3]=0,Q[4]=(V-z)*k,Q[5]=(1-(E+F))*k,Q[6]=(R+G)*k,Q[7]=0,Q[8]=(O+N)*L,Q[9]=(R-G)*L,Q[10]=(1-(E+_))*L,Q[11]=0,Q[12]=J.x,Q[13]=J.y,Q[14]=J.z,Q[15]=1,this}decompose(J,$,Z){let Q=this.elements,W=d9.set(Q[0],Q[1],Q[2]).length(),X=d9.set(Q[4],Q[5],Q[6]).length(),H=d9.set(Q[8],Q[9],Q[10]).length();if(this.determinant()<0)W=-W;J.x=Q[12],J.y=Q[13],J.z=Q[14],m7.copy(this);let q=1/W,U=1/X,K=1/H;return m7.elements[0]*=q,m7.elements[1]*=q,m7.elements[2]*=q,m7.elements[4]*=U,m7.elements[5]*=U,m7.elements[6]*=U,m7.elements[8]*=K,m7.elements[9]*=K,m7.elements[10]*=K,$.setFromRotationMatrix(m7),Z.x=W,Z.y=X,Z.z=H,this}makePerspective(J,$,Z,Q,W,X,H=2000){let Y=this.elements,q=2*W/($-J),U=2*W/(Z-Q),K=($+J)/($-J),E=(Z+Q)/(Z-Q),V,O;if(H===2000)V=-(X+W)/(X-W),O=-2*X*W/(X-W);else if(H===2001)V=-X/(X-W),O=-X*W/(X-W);else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+H);return Y[0]=q,Y[4]=0,Y[8]=K,Y[12]=0,Y[1]=0,Y[5]=U,Y[9]=E,Y[13]=0,Y[2]=0,Y[6]=0,Y[10]=V,Y[14]=O,Y[3]=0,Y[7]=0,Y[11]=-1,Y[15]=0,this}makeOrthographic(J,$,Z,Q,W,X,H=2000){let Y=this.elements,q=1/($-J),U=1/(Z-Q),K=1/(X-W),E=($+J)*q,V=(Z+Q)*U,O,_;if(H===2000)O=(X+W)*K,_=-2*K;else if(H===2001)O=W*K,_=-1*K;else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+H);return Y[0]=2*q,Y[4]=0,Y[8]=0,Y[12]=-E,Y[1]=0,Y[5]=2*U,Y[9]=0,Y[13]=-V,Y[2]=0,Y[6]=0,Y[10]=_,Y[14]=-O,Y[3]=0,Y[7]=0,Y[11]=0,Y[15]=1,this}equals(J){let $=this.elements,Z=J.elements;for(let Q=0;Q<16;Q++)if($[Q]!==Z[Q])return!1;return!0}fromArray(J,$=0){for(let Z=0;Z<16;Z++)this.elements[Z]=J[Z+$];return this}toArray(J=[],$=0){let Z=this.elements;return J[$]=Z[0],J[$+1]=Z[1],J[$+2]=Z[2],J[$+3]=Z[3],J[$+4]=Z[4],J[$+5]=Z[5],J[$+6]=Z[6],J[$+7]=Z[7],J[$+8]=Z[8],J[$+9]=Z[9],J[$+10]=Z[10],J[$+11]=Z[11],J[$+12]=Z[12],J[$+13]=Z[13],J[$+14]=Z[14],J[$+15]=Z[15],J}}var d9=new T,m7=new AJ,JW=new T(0,0,0),$W=new T(1,1,1),V9=new T,Y0=new T,j7=new T,l6=new AJ,u6=new A7;class q${constructor(J=0,$=0,Z=0,Q=q$.DEFAULT_ORDER){this.isEuler=!0,this._x=J,this._y=$,this._z=Z,this._order=Q}get x(){return this._x}set x(J){this._x=J,this._onChangeCallback()}get y(){return this._y}set y(J){this._y=J,this._onChangeCallback()}get z(){return this._z}set z(J){this._z=J,this._onChangeCallback()}get order(){return this._order}set order(J){this._order=J,this._onChangeCallback()}set(J,$,Z,Q=this._order){return this._x=J,this._y=$,this._z=Z,this._order=Q,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(J){return this._x=J._x,this._y=J._y,this._z=J._z,this._order=J._order,this._onChangeCallback(),this}setFromRotationMatrix(J,$=this._order,Z=!0){let Q=J.elements,W=Q[0],X=Q[4],H=Q[8],Y=Q[1],q=Q[5],U=Q[9],K=Q[2],E=Q[6],V=Q[10];switch($){case"XYZ":if(this._y=Math.asin(C7(H,-1,1)),Math.abs(H)<0.9999999)this._x=Math.atan2(-U,V),this._z=Math.atan2(-X,W);else this._x=Math.atan2(E,q),this._z=0;break;case"YXZ":if(this._x=Math.asin(-C7(U,-1,1)),Math.abs(U)<0.9999999)this._y=Math.atan2(H,V),this._z=Math.atan2(Y,q);else this._y=Math.atan2(-K,W),this._z=0;break;case"ZXY":if(this._x=Math.asin(C7(E,-1,1)),Math.abs(E)<0.9999999)this._y=Math.atan2(-K,V),this._z=Math.atan2(-X,q);else this._y=0,this._z=Math.atan2(Y,W);break;case"ZYX":if(this._y=Math.asin(-C7(K,-1,1)),Math.abs(K)<0.9999999)this._x=Math.atan2(E,V),this._z=Math.atan2(Y,W);else this._x=0,this._z=Math.atan2(-X,q);break;case"YZX":if(this._z=Math.asin(C7(Y,-1,1)),Math.abs(Y)<0.9999999)this._x=Math.atan2(-U,q),this._y=Math.atan2(-K,W);else this._x=0,this._y=Math.atan2(H,V);break;case"XZY":if(this._z=Math.asin(-C7(X,-1,1)),Math.abs(X)<0.9999999)this._x=Math.atan2(E,q),this._y=Math.atan2(H,W);else this._x=Math.atan2(-U,V),this._y=0;break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+$)}if(this._order=$,Z===!0)this._onChangeCallback();return this}setFromQuaternion(J,$,Z){return l6.makeRotationFromQuaternion(J),this.setFromRotationMatrix(l6,$,Z)}setFromVector3(J,$=this._order){return this.set(J.x,J.y,J.z,$)}reorder(J){return u6.setFromEuler(this),this.setFromQuaternion(u6,J)}equals(J){return J._x===this._x&&J._y===this._y&&J._z===this._z&&J._order===this._order}fromArray(J){if(this._x=J[0],this._y=J[1],this._z=J[2],J[3]!==void 0)this._order=J[3];return this._onChangeCallback(),this}toArray(J=[],$=0){return J[$]=this._x,J[$+1]=this._y,J[$+2]=this._z,J[$+3]=this._order,J}_onChange(J){return this._onChangeCallback=J,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}q$.DEFAULT_ORDER="XYZ";class b8{constructor(){this.mask=1}set(J){this.mask=(1<<J|0)>>>0}enable(J){this.mask|=1<<J|0}enableAll(){this.mask=-1}toggle(J){this.mask^=1<<J|0}disable(J){this.mask&=~(1<<J|0)}disableAll(){this.mask=0}test(J){return(this.mask&J.mask)!==0}isEnabled(J){return(this.mask&(1<<J|0))!==0}}var ZW=0,m6=new T,c9=new A7,W9=new AJ,H0=new T,B$=new T,QW=new T,WW=new A7,d6=new T(1,0,0),c6=new T(0,1,0),n6=new T(0,0,1),XW={type:"added"},YW={type:"removed"};class $7 extends M9{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:ZW++}),this.uuid=n7(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=$7.DEFAULT_UP.clone();let J=new T,$=new q$,Z=new A7,Q=new T(1,1,1);function W(){Z.setFromEuler($,!1)}function X(){$.setFromQuaternion(Z,void 0,!1)}$._onChange(W),Z._onChange(X),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:J},rotation:{configurable:!0,enumerable:!0,value:$},quaternion:{configurable:!0,enumerable:!0,value:Z},scale:{configurable:!0,enumerable:!0,value:Q},modelViewMatrix:{value:new AJ},normalMatrix:{value:new hJ}}),this.matrix=new AJ,this.matrixWorld=new AJ,this.matrixAutoUpdate=$7.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=$7.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new b8,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(J){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(J),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(J){return this.quaternion.premultiply(J),this}setRotationFromAxisAngle(J,$){this.quaternion.setFromAxisAngle(J,$)}setRotationFromEuler(J){this.quaternion.setFromEuler(J,!0)}setRotationFromMatrix(J){this.quaternion.setFromRotationMatrix(J)}setRotationFromQuaternion(J){this.quaternion.copy(J)}rotateOnAxis(J,$){return c9.setFromAxisAngle(J,$),this.quaternion.multiply(c9),this}rotateOnWorldAxis(J,$){return c9.setFromAxisAngle(J,$),this.quaternion.premultiply(c9),this}rotateX(J){return this.rotateOnAxis(d6,J)}rotateY(J){return this.rotateOnAxis(c6,J)}rotateZ(J){return this.rotateOnAxis(n6,J)}translateOnAxis(J,$){return m6.copy(J).applyQuaternion(this.quaternion),this.position.add(m6.multiplyScalar($)),this}translateX(J){return this.translateOnAxis(d6,J)}translateY(J){return this.translateOnAxis(c6,J)}translateZ(J){return this.translateOnAxis(n6,J)}localToWorld(J){return this.updateWorldMatrix(!0,!1),J.applyMatrix4(this.matrixWorld)}worldToLocal(J){return this.updateWorldMatrix(!0,!1),J.applyMatrix4(W9.copy(this.matrixWorld).invert())}lookAt(J,$,Z){if(J.isVector3)H0.copy(J);else H0.set(J,$,Z);let Q=this.parent;if(this.updateWorldMatrix(!0,!1),B$.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)W9.lookAt(B$,H0,this.up);else W9.lookAt(H0,B$,this.up);if(this.quaternion.setFromRotationMatrix(W9),Q)W9.extractRotation(Q.matrixWorld),c9.setFromRotationMatrix(W9),this.quaternion.premultiply(c9.invert())}add(J){if(arguments.length>1){for(let $=0;$<arguments.length;$++)this.add(arguments[$]);return this}if(J===this)return console.error("THREE.Object3D.add: object can't be added as a child of itself.",J),this;if(J&&J.isObject3D){if(J.parent!==null)J.parent.remove(J);J.parent=this,this.children.push(J),J.dispatchEvent(XW)}else console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",J);return this}remove(J){if(arguments.length>1){for(let Z=0;Z<arguments.length;Z++)this.remove(arguments[Z]);return this}let $=this.children.indexOf(J);if($!==-1)J.parent=null,this.children.splice($,1),J.dispatchEvent(YW);return this}removeFromParent(){let J=this.parent;if(J!==null)J.remove(this);return this}clear(){return this.remove(...this.children)}attach(J){if(this.updateWorldMatrix(!0,!1),W9.copy(this.matrixWorld).invert(),J.parent!==null)J.parent.updateWorldMatrix(!0,!1),W9.multiply(J.parent.matrixWorld);return J.applyMatrix4(W9),this.add(J),J.updateWorldMatrix(!1,!0),this}getObjectById(J){return this.getObjectByProperty("id",J)}getObjectByName(J){return this.getObjectByProperty("name",J)}getObjectByProperty(J,$){if(this[J]===$)return this;for(let Z=0,Q=this.children.length;Z<Q;Z++){let X=this.children[Z].getObjectByProperty(J,$);if(X!==void 0)return X}return}getObjectsByProperty(J,$,Z=[]){if(this[J]===$)Z.push(this);let Q=this.children;for(let W=0,X=Q.length;W<X;W++)Q[W].getObjectsByProperty(J,$,Z);return Z}getWorldPosition(J){return this.updateWorldMatrix(!0,!1),J.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(J){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(B$,J,QW),J}getWorldScale(J){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(B$,WW,J),J}getWorldDirection(J){this.updateWorldMatrix(!0,!1);let $=this.matrixWorld.elements;return J.set($[8],$[9],$[10]).normalize()}raycast(){}traverse(J){J(this);let $=this.children;for(let Z=0,Q=$.length;Z<Q;Z++)$[Z].traverse(J)}traverseVisible(J){if(this.visible===!1)return;J(this);let $=this.children;for(let Z=0,Q=$.length;Z<Q;Z++)$[Z].traverseVisible(J)}traverseAncestors(J){let $=this.parent;if($!==null)J($),$.traverseAncestors(J)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(J){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||J){if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,J=!0}let $=this.children;for(let Z=0,Q=$.length;Z<Q;Z++){let W=$[Z];if(W.matrixWorldAutoUpdate===!0||J===!0)W.updateMatrixWorld(J)}}updateWorldMatrix(J,$){let Z=this.parent;if(J===!0&&Z!==null&&Z.matrixWorldAutoUpdate===!0)Z.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);if($===!0){let Q=this.children;for(let W=0,X=Q.length;W<X;W++){let H=Q[W];if(H.matrixWorldAutoUpdate===!0)H.updateWorldMatrix(!1,!0)}}}toJSON(J){let $=J===void 0||typeof J==="string",Z={};if($)J={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},Z.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"};let Q={};if(Q.uuid=this.uuid,Q.type=this.type,this.name!=="")Q.name=this.name;if(this.castShadow===!0)Q.castShadow=!0;if(this.receiveShadow===!0)Q.receiveShadow=!0;if(this.visible===!1)Q.visible=!1;if(this.frustumCulled===!1)Q.frustumCulled=!1;if(this.renderOrder!==0)Q.renderOrder=this.renderOrder;if(Object.keys(this.userData).length>0)Q.userData=this.userData;if(Q.layers=this.layers.mask,Q.matrix=this.matrix.toArray(),Q.up=this.up.toArray(),this.matrixAutoUpdate===!1)Q.matrixAutoUpdate=!1;if(this.isInstancedMesh){if(Q.type="InstancedMesh",Q.count=this.count,Q.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)Q.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if(Q.type="BatchedMesh",Q.perObjectFrustumCulled=this.perObjectFrustumCulled,Q.sortObjects=this.sortObjects,Q.drawRanges=this._drawRanges,Q.reservedRanges=this._reservedRanges,Q.visibility=this._visibility,Q.active=this._active,Q.bounds=this._bounds.map((H)=>({boxInitialized:H.boxInitialized,boxMin:H.box.min.toArray(),boxMax:H.box.max.toArray(),sphereInitialized:H.sphereInitialized,sphereRadius:H.sphere.radius,sphereCenter:H.sphere.center.toArray()})),Q.maxGeometryCount=this._maxGeometryCount,Q.maxVertexCount=this._maxVertexCount,Q.maxIndexCount=this._maxIndexCount,Q.geometryInitialized=this._geometryInitialized,Q.geometryCount=this._geometryCount,Q.matricesTexture=this._matricesTexture.toJSON(J),this.boundingSphere!==null)Q.boundingSphere={center:Q.boundingSphere.center.toArray(),radius:Q.boundingSphere.radius};if(this.boundingBox!==null)Q.boundingBox={min:Q.boundingBox.min.toArray(),max:Q.boundingBox.max.toArray()}}function W(H,Y){if(H[Y.uuid]===void 0)H[Y.uuid]=Y.toJSON(J);return Y.uuid}if(this.isScene){if(this.background){if(this.background.isColor)Q.background=this.background.toJSON();else if(this.background.isTexture)Q.background=this.background.toJSON(J).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)Q.environment=this.environment.toJSON(J).uuid}else if(this.isMesh||this.isLine||this.isPoints){Q.geometry=W(J.geometries,this.geometry);let H=this.geometry.parameters;if(H!==void 0&&H.shapes!==void 0){let Y=H.shapes;if(Array.isArray(Y))for(let q=0,U=Y.length;q<U;q++){let K=Y[q];W(J.shapes,K)}else W(J.shapes,Y)}}if(this.isSkinnedMesh){if(Q.bindMode=this.bindMode,Q.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)W(J.skeletons,this.skeleton),Q.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let H=[];for(let Y=0,q=this.material.length;Y<q;Y++)H.push(W(J.materials,this.material[Y]));Q.material=H}else Q.material=W(J.materials,this.material);if(this.children.length>0){Q.children=[];for(let H=0;H<this.children.length;H++)Q.children.push(this.children[H].toJSON(J).object)}if(this.animations.length>0){Q.animations=[];for(let H=0;H<this.animations.length;H++){let Y=this.animations[H];Q.animations.push(W(J.animations,Y))}}if($){let H=X(J.geometries),Y=X(J.materials),q=X(J.textures),U=X(J.images),K=X(J.shapes),E=X(J.skeletons),V=X(J.animations),O=X(J.nodes);if(H.length>0)Z.geometries=H;if(Y.length>0)Z.materials=Y;if(q.length>0)Z.textures=q;if(U.length>0)Z.images=U;if(K.length>0)Z.shapes=K;if(E.length>0)Z.skeletons=E;if(V.length>0)Z.animations=V;if(O.length>0)Z.nodes=O}return Z.object=Q,Z;function X(H){let Y=[];for(let q in H){let U=H[q];delete U.metadata,Y.push(U)}return Y}}clone(J){return new this.constructor().copy(this,J)}copy(J,$=!0){if(this.name=J.name,this.up.copy(J.up),this.position.copy(J.position),this.rotation.order=J.rotation.order,this.quaternion.copy(J.quaternion),this.scale.copy(J.scale),this.matrix.copy(J.matrix),this.matrixWorld.copy(J.matrixWorld),this.matrixAutoUpdate=J.matrixAutoUpdate,this.matrixWorldAutoUpdate=J.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=J.matrixWorldNeedsUpdate,this.layers.mask=J.layers.mask,this.visible=J.visible,this.castShadow=J.castShadow,this.receiveShadow=J.receiveShadow,this.frustumCulled=J.frustumCulled,this.renderOrder=J.renderOrder,this.animations=J.animations.slice(),this.userData=JSON.parse(JSON.stringify(J.userData)),$===!0)for(let Z=0;Z<J.children.length;Z++){let Q=J.children[Z];this.add(Q.clone())}return this}}$7.DEFAULT_UP=new T(0,1,0);$7.DEFAULT_MATRIX_AUTO_UPDATE=!0;$7.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var d7=new T,X9=new T,U8=new T,Y9=new T,n9=new T,s9=new T,s6=new T,K8=new T,E8=new T,V8=new T,q0=!1;class c7{constructor(J=new T,$=new T,Z=new T){this.a=J,this.b=$,this.c=Z}static getNormal(J,$,Z,Q){Q.subVectors(Z,$),d7.subVectors(J,$),Q.cross(d7);let W=Q.lengthSq();if(W>0)return Q.multiplyScalar(1/Math.sqrt(W));return Q.set(0,0,0)}static getBarycoord(J,$,Z,Q,W){d7.subVectors(Q,$),X9.subVectors(Z,$),U8.subVectors(J,$);let X=d7.dot(d7),H=d7.dot(X9),Y=d7.dot(U8),q=X9.dot(X9),U=X9.dot(U8),K=X*q-H*H;if(K===0)return W.set(0,0,0),null;let E=1/K,V=(q*Y-H*U)*E,O=(X*U-H*Y)*E;return W.set(1-V-O,O,V)}static containsPoint(J,$,Z,Q){if(this.getBarycoord(J,$,Z,Q,Y9)===null)return!1;return Y9.x>=0&&Y9.y>=0&&Y9.x+Y9.y<=1}static getUV(J,$,Z,Q,W,X,H,Y){if(q0===!1)console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),q0=!0;return this.getInterpolation(J,$,Z,Q,W,X,H,Y)}static getInterpolation(J,$,Z,Q,W,X,H,Y){if(this.getBarycoord(J,$,Z,Q,Y9)===null){if(Y.x=0,Y.y=0,"z"in Y)Y.z=0;if("w"in Y)Y.w=0;return null}return Y.setScalar(0),Y.addScaledVector(W,Y9.x),Y.addScaledVector(X,Y9.y),Y.addScaledVector(H,Y9.z),Y}static isFrontFacing(J,$,Z,Q){return d7.subVectors(Z,$),X9.subVectors(J,$),d7.cross(X9).dot(Q)<0?!0:!1}set(J,$,Z){return this.a.copy(J),this.b.copy($),this.c.copy(Z),this}setFromPointsAndIndices(J,$,Z,Q){return this.a.copy(J[$]),this.b.copy(J[Z]),this.c.copy(J[Q]),this}setFromAttributeAndIndices(J,$,Z,Q){return this.a.fromBufferAttribute(J,$),this.b.fromBufferAttribute(J,Z),this.c.fromBufferAttribute(J,Q),this}clone(){return new this.constructor().copy(this)}copy(J){return this.a.copy(J.a),this.b.copy(J.b),this.c.copy(J.c),this}getArea(){return d7.subVectors(this.c,this.b),X9.subVectors(this.a,this.b),d7.cross(X9).length()*0.5}getMidpoint(J){return J.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(J){return c7.getNormal(this.a,this.b,this.c,J)}getPlane(J){return J.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(J,$){return c7.getBarycoord(J,this.a,this.b,this.c,$)}getUV(J,$,Z,Q,W){if(q0===!1)console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),q0=!0;return c7.getInterpolation(J,this.a,this.b,this.c,$,Z,Q,W)}getInterpolation(J,$,Z,Q,W){return c7.getInterpolation(J,this.a,this.b,this.c,$,Z,Q,W)}containsPoint(J){return c7.containsPoint(J,this.a,this.b,this.c)}isFrontFacing(J){return c7.isFrontFacing(this.a,this.b,this.c,J)}intersectsBox(J){return J.intersectsTriangle(this)}closestPointToPoint(J,$){let Z=this.a,Q=this.b,W=this.c,X,H;n9.subVectors(Q,Z),s9.subVectors(W,Z),K8.subVectors(J,Z);let Y=n9.dot(K8),q=s9.dot(K8);if(Y<=0&&q<=0)return $.copy(Z);E8.subVectors(J,Q);let U=n9.dot(E8),K=s9.dot(E8);if(U>=0&&K<=U)return $.copy(Q);let E=Y*K-U*q;if(E<=0&&Y>=0&&U<=0)return X=Y/(Y-U),$.copy(Z).addScaledVector(n9,X);V8.subVectors(J,W);let V=n9.dot(V8),O=s9.dot(V8);if(O>=0&&V<=O)return $.copy(W);let _=V*q-Y*O;if(_<=0&&q>=0&&O<=0)return H=q/(q-O),$.copy(Z).addScaledVector(s9,H);let R=U*O-V*K;if(R<=0&&K-U>=0&&V-O>=0)return s6.subVectors(W,Q),H=(K-U)/(K-U+(V-O)),$.copy(Q).addScaledVector(s6,H);let F=1/(R+_+E);return X=_*F,H=E*F,$.copy(Z).addScaledVector(n9,X).addScaledVector(s9,H)}equals(J){return J.a.equals(this.a)&&J.b.equals(this.b)&&J.c.equals(this.c)}}var eZ={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},G9={h:0,s:0,l:0},U0={h:0,s:0,l:0};function G8(J,$,Z){if(Z<0)Z+=1;if(Z>1)Z-=1;if(Z<0.16666666666666666)return J+($-J)*6*Z;if(Z<0.5)return $;if(Z<0.6666666666666666)return J+($-J)*6*(0.6666666666666666-Z);return J}class GJ{constructor(J,$,Z){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(J,$,Z)}set(J,$,Z){if($===void 0&&Z===void 0){let Q=J;if(Q&&Q.isColor)this.copy(Q);else if(typeof Q==="number")this.setHex(Q);else if(typeof Q==="string")this.setStyle(Q)}else this.setRGB(J,$,Z);return this}setScalar(J){return this.r=J,this.g=J,this.b=J,this}setHex(J,$="srgb"){return J=Math.floor(J),this.r=(J>>16&255)/255,this.g=(J>>8&255)/255,this.b=(J&255)/255,iJ.toWorkingColorSpace(this,$),this}setRGB(J,$,Z,Q=iJ.workingColorSpace){return this.r=J,this.g=$,this.b=Z,iJ.toWorkingColorSpace(this,Q),this}setHSL(J,$,Z,Q=iJ.workingColorSpace){if(J=y8(J,1),$=C7($,0,1),Z=C7(Z,0,1),$===0)this.r=this.g=this.b=Z;else{let W=Z<=0.5?Z*(1+$):Z+$-Z*$,X=2*Z-W;this.r=G8(X,W,J+0.3333333333333333),this.g=G8(X,W,J),this.b=G8(X,W,J-0.3333333333333333)}return iJ.toWorkingColorSpace(this,Q),this}setStyle(J,$="srgb"){function Z(W){if(W===void 0)return;if(parseFloat(W)<1)console.warn("THREE.Color: Alpha component of "+J+" will be ignored.")}let Q;if(Q=/^(\w+)\(([^\)]*)\)/.exec(J)){let W,X=Q[1],H=Q[2];switch(X){case"rgb":case"rgba":if(W=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(H))return Z(W[4]),this.setRGB(Math.min(255,parseInt(W[1],10))/255,Math.min(255,parseInt(W[2],10))/255,Math.min(255,parseInt(W[3],10))/255,$);if(W=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(H))return Z(W[4]),this.setRGB(Math.min(100,parseInt(W[1],10))/100,Math.min(100,parseInt(W[2],10))/100,Math.min(100,parseInt(W[3],10))/100,$);break;case"hsl":case"hsla":if(W=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(H))return Z(W[4]),this.setHSL(parseFloat(W[1])/360,parseFloat(W[2])/100,parseFloat(W[3])/100,$);break;default:console.warn("THREE.Color: Unknown color model "+J)}}else if(Q=/^\#([A-Fa-f\d]+)$/.exec(J)){let W=Q[1],X=W.length;if(X===3)return this.setRGB(parseInt(W.charAt(0),16)/15,parseInt(W.charAt(1),16)/15,parseInt(W.charAt(2),16)/15,$);else if(X===6)return this.setHex(parseInt(W,16),$);else console.warn("THREE.Color: Invalid hex color "+J)}else if(J&&J.length>0)return this.setColorName(J,$);return this}setColorName(J,$="srgb"){let Z=eZ[J.toLowerCase()];if(Z!==void 0)this.setHex(Z,$);else console.warn("THREE.Color: Unknown color "+J);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(J){return this.r=J.r,this.g=J.g,this.b=J.b,this}copySRGBToLinear(J){return this.r=W$(J.r),this.g=W$(J.g),this.b=W$(J.b),this}copyLinearToSRGB(J){return this.r=$8(J.r),this.g=$8(J.g),this.b=$8(J.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(J="srgb"){return iJ.fromWorkingColorSpace(L7.copy(this),J),Math.round(C7(L7.r*255,0,255))*65536+Math.round(C7(L7.g*255,0,255))*256+Math.round(C7(L7.b*255,0,255))}getHexString(J="srgb"){return("000000"+this.getHex(J).toString(16)).slice(-6)}getHSL(J,$=iJ.workingColorSpace){iJ.fromWorkingColorSpace(L7.copy(this),$);let{r:Z,g:Q,b:W}=L7,X=Math.max(Z,Q,W),H=Math.min(Z,Q,W),Y,q,U=(H+X)/2;if(H===X)Y=0,q=0;else{let K=X-H;switch(q=U<=0.5?K/(X+H):K/(2-X-H),X){case Z:Y=(Q-W)/K+(Q<W?6:0);break;case Q:Y=(W-Z)/K+2;break;case W:Y=(Z-Q)/K+4;break}Y/=6}return J.h=Y,J.s=q,J.l=U,J}getRGB(J,$=iJ.workingColorSpace){return iJ.fromWorkingColorSpace(L7.copy(this),$),J.r=L7.r,J.g=L7.g,J.b=L7.b,J}getStyle(J="srgb"){iJ.fromWorkingColorSpace(L7.copy(this),J);let{r:$,g:Z,b:Q}=L7;if(J!=="srgb")return`color(${J} ${$.toFixed(3)} ${Z.toFixed(3)} ${Q.toFixed(3)})`;return`rgb(${Math.round($*255)},${Math.round(Z*255)},${Math.round(Q*255)})`}offsetHSL(J,$,Z){return this.getHSL(G9),this.setHSL(G9.h+J,G9.s+$,G9.l+Z)}add(J){return this.r+=J.r,this.g+=J.g,this.b+=J.b,this}addColors(J,$){return this.r=J.r+$.r,this.g=J.g+$.g,this.b=J.b+$.b,this}addScalar(J){return this.r+=J,this.g+=J,this.b+=J,this}sub(J){return this.r=Math.max(0,this.r-J.r),this.g=Math.max(0,this.g-J.g),this.b=Math.max(0,this.b-J.b),this}multiply(J){return this.r*=J.r,this.g*=J.g,this.b*=J.b,this}multiplyScalar(J){return this.r*=J,this.g*=J,this.b*=J,this}lerp(J,$){return this.r+=(J.r-this.r)*$,this.g+=(J.g-this.g)*$,this.b+=(J.b-this.b)*$,this}lerpColors(J,$,Z){return this.r=J.r+($.r-J.r)*Z,this.g=J.g+($.g-J.g)*Z,this.b=J.b+($.b-J.b)*Z,this}lerpHSL(J,$){this.getHSL(G9),J.getHSL(U0);let Z=k$(G9.h,U0.h,$),Q=k$(G9.s,U0.s,$),W=k$(G9.l,U0.l,$);return this.setHSL(Z,Q,W),this}setFromVector3(J){return this.r=J.x,this.g=J.y,this.b=J.z,this}applyMatrix3(J){let $=this.r,Z=this.g,Q=this.b,W=J.elements;return this.r=W[0]*$+W[3]*Z+W[6]*Q,this.g=W[1]*$+W[4]*Z+W[7]*Q,this.b=W[2]*$+W[5]*Z+W[8]*Q,this}equals(J){return J.r===this.r&&J.g===this.g&&J.b===this.b}fromArray(J,$=0){return this.r=J[$],this.g=J[$+1],this.b=J[$+2],this}toArray(J=[],$=0){return J[$]=this.r,J[$+1]=this.g,J[$+2]=this.b,J}fromBufferAttribute(J,$){return this.r=J.getX($),this.g=J.getY($),this.b=J.getZ($),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var L7=new GJ;GJ.NAMES=eZ;var HW=0;class x7 extends M9{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:HW++}),this.uuid=n7(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new GJ(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(J){if(this._alphaTest>0!==J>0)this.version++;this._alphaTest=J}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(J){if(J===void 0)return;for(let $ in J){let Z=J[$];if(Z===void 0){console.warn(`THREE.Material: parameter '${$}' has value of undefined.`);continue}let Q=this[$];if(Q===void 0){console.warn(`THREE.Material: '${$}' is not a property of THREE.${this.type}.`);continue}if(Q&&Q.isColor)Q.set(Z);else if(Q&&Q.isVector3&&(Z&&Z.isVector3))Q.copy(Z);else this[$]=Z}}toJSON(J){let $=J===void 0||typeof J==="string";if($)J={textures:{},images:{}};let Z={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};if(Z.uuid=this.uuid,Z.type=this.type,this.name!=="")Z.name=this.name;if(this.color&&this.color.isColor)Z.color=this.color.getHex();if(this.roughness!==void 0)Z.roughness=this.roughness;if(this.metalness!==void 0)Z.metalness=this.metalness;if(this.sheen!==void 0)Z.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)Z.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)Z.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)Z.emissive=this.emissive.getHex();if(this.emissiveIntensity&&this.emissiveIntensity!==1)Z.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)Z.specular=this.specular.getHex();if(this.specularIntensity!==void 0)Z.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)Z.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)Z.shininess=this.shininess;if(this.clearcoat!==void 0)Z.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)Z.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)Z.clearcoatMap=this.clearcoatMap.toJSON(J).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)Z.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(J).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)Z.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(J).uuid,Z.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.iridescence!==void 0)Z.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)Z.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)Z.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)Z.iridescenceMap=this.iridescenceMap.toJSON(J).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)Z.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(J).uuid;if(this.anisotropy!==void 0)Z.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)Z.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)Z.anisotropyMap=this.anisotropyMap.toJSON(J).uuid;if(this.map&&this.map.isTexture)Z.map=this.map.toJSON(J).uuid;if(this.matcap&&this.matcap.isTexture)Z.matcap=this.matcap.toJSON(J).uuid;if(this.alphaMap&&this.alphaMap.isTexture)Z.alphaMap=this.alphaMap.toJSON(J).uuid;if(this.lightMap&&this.lightMap.isTexture)Z.lightMap=this.lightMap.toJSON(J).uuid,Z.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)Z.aoMap=this.aoMap.toJSON(J).uuid,Z.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)Z.bumpMap=this.bumpMap.toJSON(J).uuid,Z.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)Z.normalMap=this.normalMap.toJSON(J).uuid,Z.normalMapType=this.normalMapType,Z.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)Z.displacementMap=this.displacementMap.toJSON(J).uuid,Z.displacementScale=this.displacementScale,Z.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)Z.roughnessMap=this.roughnessMap.toJSON(J).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)Z.metalnessMap=this.metalnessMap.toJSON(J).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)Z.emissiveMap=this.emissiveMap.toJSON(J).uuid;if(this.specularMap&&this.specularMap.isTexture)Z.specularMap=this.specularMap.toJSON(J).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)Z.specularIntensityMap=this.specularIntensityMap.toJSON(J).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)Z.specularColorMap=this.specularColorMap.toJSON(J).uuid;if(this.envMap&&this.envMap.isTexture){if(Z.envMap=this.envMap.toJSON(J).uuid,this.combine!==void 0)Z.combine=this.combine}if(this.envMapIntensity!==void 0)Z.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)Z.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)Z.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)Z.gradientMap=this.gradientMap.toJSON(J).uuid;if(this.transmission!==void 0)Z.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)Z.transmissionMap=this.transmissionMap.toJSON(J).uuid;if(this.thickness!==void 0)Z.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)Z.thicknessMap=this.thicknessMap.toJSON(J).uuid;if(this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0)Z.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)Z.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)Z.size=this.size;if(this.shadowSide!==null)Z.shadowSide=this.shadowSide;if(this.sizeAttenuation!==void 0)Z.sizeAttenuation=this.sizeAttenuation;if(this.blending!==1)Z.blending=this.blending;if(this.side!==0)Z.side=this.side;if(this.vertexColors===!0)Z.vertexColors=!0;if(this.opacity<1)Z.opacity=this.opacity;if(this.transparent===!0)Z.transparent=!0;if(this.blendSrc!==204)Z.blendSrc=this.blendSrc;if(this.blendDst!==205)Z.blendDst=this.blendDst;if(this.blendEquation!==100)Z.blendEquation=this.blendEquation;if(this.blendSrcAlpha!==null)Z.blendSrcAlpha=this.blendSrcAlpha;if(this.blendDstAlpha!==null)Z.blendDstAlpha=this.blendDstAlpha;if(this.blendEquationAlpha!==null)Z.blendEquationAlpha=this.blendEquationAlpha;if(this.blendColor&&this.blendColor.isColor)Z.blendColor=this.blendColor.getHex();if(this.blendAlpha!==0)Z.blendAlpha=this.blendAlpha;if(this.depthFunc!==3)Z.depthFunc=this.depthFunc;if(this.depthTest===!1)Z.depthTest=this.depthTest;if(this.depthWrite===!1)Z.depthWrite=this.depthWrite;if(this.colorWrite===!1)Z.colorWrite=this.colorWrite;if(this.stencilWriteMask!==255)Z.stencilWriteMask=this.stencilWriteMask;if(this.stencilFunc!==519)Z.stencilFunc=this.stencilFunc;if(this.stencilRef!==0)Z.stencilRef=this.stencilRef;if(this.stencilFuncMask!==255)Z.stencilFuncMask=this.stencilFuncMask;if(this.stencilFail!==7680)Z.stencilFail=this.stencilFail;if(this.stencilZFail!==7680)Z.stencilZFail=this.stencilZFail;if(this.stencilZPass!==7680)Z.stencilZPass=this.stencilZPass;if(this.stencilWrite===!0)Z.stencilWrite=this.stencilWrite;if(this.rotation!==void 0&&this.rotation!==0)Z.rotation=this.rotation;if(this.polygonOffset===!0)Z.polygonOffset=!0;if(this.polygonOffsetFactor!==0)Z.polygonOffsetFactor=this.polygonOffsetFactor;if(this.polygonOffsetUnits!==0)Z.polygonOffsetUnits=this.polygonOffsetUnits;if(this.linewidth!==void 0&&this.linewidth!==1)Z.linewidth=this.linewidth;if(this.dashSize!==void 0)Z.dashSize=this.dashSize;if(this.gapSize!==void 0)Z.gapSize=this.gapSize;if(this.scale!==void 0)Z.scale=this.scale;if(this.dithering===!0)Z.dithering=!0;if(this.alphaTest>0)Z.alphaTest=this.alphaTest;if(this.alphaHash===!0)Z.alphaHash=!0;if(this.alphaToCoverage===!0)Z.alphaToCoverage=!0;if(this.premultipliedAlpha===!0)Z.premultipliedAlpha=!0;if(this.forceSinglePass===!0)Z.forceSinglePass=!0;if(this.wireframe===!0)Z.wireframe=!0;if(this.wireframeLinewidth>1)Z.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!=="round")Z.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!=="round")Z.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading===!0)Z.flatShading=!0;if(this.visible===!1)Z.visible=!1;if(this.toneMapped===!1)Z.toneMapped=!1;if(this.fog===!1)Z.fog=!1;if(Object.keys(this.userData).length>0)Z.userData=this.userData;function Q(W){let X=[];for(let H in W){let Y=W[H];delete Y.metadata,X.push(Y)}return X}if($){let W=Q(J.textures),X=Q(J.images);if(W.length>0)Z.textures=W;if(X.length>0)Z.images=X}return Z}clone(){return new this.constructor().copy(this)}copy(J){this.name=J.name,this.blending=J.blending,this.side=J.side,this.vertexColors=J.vertexColors,this.opacity=J.opacity,this.transparent=J.transparent,this.blendSrc=J.blendSrc,this.blendDst=J.blendDst,this.blendEquation=J.blendEquation,this.blendSrcAlpha=J.blendSrcAlpha,this.blendDstAlpha=J.blendDstAlpha,this.blendEquationAlpha=J.blendEquationAlpha,this.blendColor.copy(J.blendColor),this.blendAlpha=J.blendAlpha,this.depthFunc=J.depthFunc,this.depthTest=J.depthTest,this.depthWrite=J.depthWrite,this.stencilWriteMask=J.stencilWriteMask,this.stencilFunc=J.stencilFunc,this.stencilRef=J.stencilRef,this.stencilFuncMask=J.stencilFuncMask,this.stencilFail=J.stencilFail,this.stencilZFail=J.stencilZFail,this.stencilZPass=J.stencilZPass,this.stencilWrite=J.stencilWrite;let $=J.clippingPlanes,Z=null;if($!==null){let Q=$.length;Z=Array(Q);for(let W=0;W!==Q;++W)Z[W]=$[W].clone()}return this.clippingPlanes=Z,this.clipIntersection=J.clipIntersection,this.clipShadows=J.clipShadows,this.shadowSide=J.shadowSide,this.colorWrite=J.colorWrite,this.precision=J.precision,this.polygonOffset=J.polygonOffset,this.polygonOffsetFactor=J.polygonOffsetFactor,this.polygonOffsetUnits=J.polygonOffsetUnits,this.dithering=J.dithering,this.alphaTest=J.alphaTest,this.alphaHash=J.alphaHash,this.alphaToCoverage=J.alphaToCoverage,this.premultipliedAlpha=J.premultipliedAlpha,this.forceSinglePass=J.forceSinglePass,this.visible=J.visible,this.toneMapped=J.toneMapped,this.userData=JSON.parse(JSON.stringify(J.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(J){if(J===!0)this.version++}}class f7 extends x7{constructor(J){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new GJ(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.lightMap=J.lightMap,this.lightMapIntensity=J.lightMapIntensity,this.aoMap=J.aoMap,this.aoMapIntensity=J.aoMapIntensity,this.specularMap=J.specularMap,this.alphaMap=J.alphaMap,this.envMap=J.envMap,this.combine=J.combine,this.reflectivity=J.reflectivity,this.refractionRatio=J.refractionRatio,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.wireframeLinecap=J.wireframeLinecap,this.wireframeLinejoin=J.wireframeLinejoin,this.fog=J.fog,this}}var K7=new T,K0=new yJ;class Z7{constructor(J,$,Z=!1){if(Array.isArray(J))throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=J,this.itemSize=$,this.count=J!==void 0?J.length/$:0,this.normalized=Z,this.usage=35044,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(J){if(J===!0)this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(J){return this.usage=J,this}addUpdateRange(J,$){this.updateRanges.push({start:J,count:$})}clearUpdateRanges(){this.updateRanges.length=0}copy(J){return this.name=J.name,this.array=new J.array.constructor(J.array),this.itemSize=J.itemSize,this.count=J.count,this.normalized=J.normalized,this.usage=J.usage,this.gpuType=J.gpuType,this}copyAt(J,$,Z){J*=this.itemSize,Z*=$.itemSize;for(let Q=0,W=this.itemSize;Q<W;Q++)this.array[J+Q]=$.array[Z+Q];return this}copyArray(J){return this.array.set(J),this}applyMatrix3(J){if(this.itemSize===2)for(let $=0,Z=this.count;$<Z;$++)K0.fromBufferAttribute(this,$),K0.applyMatrix3(J),this.setXY($,K0.x,K0.y);else if(this.itemSize===3)for(let $=0,Z=this.count;$<Z;$++)K7.fromBufferAttribute(this,$),K7.applyMatrix3(J),this.setXYZ($,K7.x,K7.y,K7.z);return this}applyMatrix4(J){for(let $=0,Z=this.count;$<Z;$++)K7.fromBufferAttribute(this,$),K7.applyMatrix4(J),this.setXYZ($,K7.x,K7.y,K7.z);return this}applyNormalMatrix(J){for(let $=0,Z=this.count;$<Z;$++)K7.fromBufferAttribute(this,$),K7.applyNormalMatrix(J),this.setXYZ($,K7.x,K7.y,K7.z);return this}transformDirection(J){for(let $=0,Z=this.count;$<Z;$++)K7.fromBufferAttribute(this,$),K7.transformDirection(J),this.setXYZ($,K7.x,K7.y,K7.z);return this}set(J,$=0){return this.array.set(J,$),this}getComponent(J,$){let Z=this.array[J*this.itemSize+$];if(this.normalized)Z=t7(Z,this.array);return Z}setComponent(J,$,Z){if(this.normalized)Z=aJ(Z,this.array);return this.array[J*this.itemSize+$]=Z,this}getX(J){let $=this.array[J*this.itemSize];if(this.normalized)$=t7($,this.array);return $}setX(J,$){if(this.normalized)$=aJ($,this.array);return this.array[J*this.itemSize]=$,this}getY(J){let $=this.array[J*this.itemSize+1];if(this.normalized)$=t7($,this.array);return $}setY(J,$){if(this.normalized)$=aJ($,this.array);return this.array[J*this.itemSize+1]=$,this}getZ(J){let $=this.array[J*this.itemSize+2];if(this.normalized)$=t7($,this.array);return $}setZ(J,$){if(this.normalized)$=aJ($,this.array);return this.array[J*this.itemSize+2]=$,this}getW(J){let $=this.array[J*this.itemSize+3];if(this.normalized)$=t7($,this.array);return $}setW(J,$){if(this.normalized)$=aJ($,this.array);return this.array[J*this.itemSize+3]=$,this}setXY(J,$,Z){if(J*=this.itemSize,this.normalized)$=aJ($,this.array),Z=aJ(Z,this.array);return this.array[J+0]=$,this.array[J+1]=Z,this}setXYZ(J,$,Z,Q){if(J*=this.itemSize,this.normalized)$=aJ($,this.array),Z=aJ(Z,this.array),Q=aJ(Q,this.array);return this.array[J+0]=$,this.array[J+1]=Z,this.array[J+2]=Q,this}setXYZW(J,$,Z,Q,W){if(J*=this.itemSize,this.normalized)$=aJ($,this.array),Z=aJ(Z,this.array),Q=aJ(Q,this.array),W=aJ(W,this.array);return this.array[J+0]=$,this.array[J+1]=Z,this.array[J+2]=Q,this.array[J+3]=W,this}onUpload(J){return this.onUploadCallback=J,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let J={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};if(this.name!=="")J.name=this.name;if(this.usage!==35044)J.usage=this.usage;return J}}class g8 extends Z7{constructor(J,$,Z){super(new Uint16Array(J),$,Z)}}class p8 extends Z7{constructor(J,$,Z){super(new Uint32Array(J),$,Z)}}class X7 extends Z7{constructor(J,$,Z){super(new Float32Array(J),$,Z)}}var qW=0,b7=new AJ,F8=new $7,i9=new T,v7=new y7,D$=new y7,z7=new T;class E7 extends M9{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qW++}),this.uuid=n7(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(J){if(Array.isArray(J))this.index=new((aZ(J))?p8:g8)(J,1);else this.index=J;return this}getAttribute(J){return this.attributes[J]}setAttribute(J,$){return this.attributes[J]=$,this}deleteAttribute(J){return delete this.attributes[J],this}hasAttribute(J){return this.attributes[J]!==void 0}addGroup(J,$,Z=0){this.groups.push({start:J,count:$,materialIndex:Z})}clearGroups(){this.groups=[]}setDrawRange(J,$){this.drawRange.start=J,this.drawRange.count=$}applyMatrix4(J){let $=this.attributes.position;if($!==void 0)$.applyMatrix4(J),$.needsUpdate=!0;let Z=this.attributes.normal;if(Z!==void 0){let W=new hJ().getNormalMatrix(J);Z.applyNormalMatrix(W),Z.needsUpdate=!0}let Q=this.attributes.tangent;if(Q!==void 0)Q.transformDirection(J),Q.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this}applyQuaternion(J){return b7.makeRotationFromQuaternion(J),this.applyMatrix4(b7),this}rotateX(J){return b7.makeRotationX(J),this.applyMatrix4(b7),this}rotateY(J){return b7.makeRotationY(J),this.applyMatrix4(b7),this}rotateZ(J){return b7.makeRotationZ(J),this.applyMatrix4(b7),this}translate(J,$,Z){return b7.makeTranslation(J,$,Z),this.applyMatrix4(b7),this}scale(J,$,Z){return b7.makeScale(J,$,Z),this.applyMatrix4(b7),this}lookAt(J){return F8.lookAt(J),F8.updateMatrix(),this.applyMatrix4(F8.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(i9).negate(),this.translate(i9.x,i9.y,i9.z),this}setFromPoints(J){let $=[];for(let Z=0,Q=J.length;Z<Q;Z++){let W=J[Z];$.push(W.x,W.y,W.z||0)}return this.setAttribute("position",new X7($,3)),this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new y7;let J=this.attributes.position,$=this.morphAttributes.position;if(J&&J.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new T(-1/0,-1/0,-1/0),new T(1/0,1/0,1/0));return}if(J!==void 0){if(this.boundingBox.setFromBufferAttribute(J),$)for(let Z=0,Q=$.length;Z<Q;Z++){let W=$[Z];if(v7.setFromBufferAttribute(W),this.morphTargetsRelative)z7.addVectors(this.boundingBox.min,v7.min),this.boundingBox.expandByPoint(z7),z7.addVectors(this.boundingBox.max,v7.max),this.boundingBox.expandByPoint(z7);else this.boundingBox.expandByPoint(v7.min),this.boundingBox.expandByPoint(v7.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new g7;let J=this.attributes.position,$=this.morphAttributes.position;if(J&&J.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new T,1/0);return}if(J){let Z=this.boundingSphere.center;if(v7.setFromBufferAttribute(J),$)for(let W=0,X=$.length;W<X;W++){let H=$[W];if(D$.setFromBufferAttribute(H),this.morphTargetsRelative)z7.addVectors(v7.min,D$.min),v7.expandByPoint(z7),z7.addVectors(v7.max,D$.max),v7.expandByPoint(z7);else v7.expandByPoint(D$.min),v7.expandByPoint(D$.max)}v7.getCenter(Z);let Q=0;for(let W=0,X=J.count;W<X;W++)z7.fromBufferAttribute(J,W),Q=Math.max(Q,Z.distanceToSquared(z7));if($)for(let W=0,X=$.length;W<X;W++){let H=$[W],Y=this.morphTargetsRelative;for(let q=0,U=H.count;q<U;q++){if(z7.fromBufferAttribute(H,q),Y)i9.fromBufferAttribute(J,q),z7.add(i9);Q=Math.max(Q,Z.distanceToSquared(z7))}}if(this.boundingSphere.radius=Math.sqrt(Q),isNaN(this.boundingSphere.radius))console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let J=this.index,$=this.attributes;if(J===null||$.position===void 0||$.normal===void 0||$.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let Z=J.array,Q=$.position.array,W=$.normal.array,X=$.uv.array,H=Q.length/3;if(this.hasAttribute("tangent")===!1)this.setAttribute("tangent",new Z7(new Float32Array(4*H),4));let Y=this.getAttribute("tangent").array,q=[],U=[];for(let B=0;B<H;B++)q[B]=new T,U[B]=new T;let K=new T,E=new T,V=new T,O=new yJ,_=new yJ,R=new yJ,F=new T,G=new T;function N(B,I,y){K.fromArray(Q,B*3),E.fromArray(Q,I*3),V.fromArray(Q,y*3),O.fromArray(X,B*2),_.fromArray(X,I*2),R.fromArray(X,y*2),E.sub(K),V.sub(K),_.sub(O),R.sub(O);let c=1/(_.x*R.y-R.x*_.y);if(!isFinite(c))return;F.copy(E).multiplyScalar(R.y).addScaledVector(V,-_.y).multiplyScalar(c),G.copy(V).multiplyScalar(_.x).addScaledVector(E,-R.x).multiplyScalar(c),q[B].add(F),q[I].add(F),q[y].add(F),U[B].add(G),U[I].add(G),U[y].add(G)}let z=this.groups;if(z.length===0)z=[{start:0,count:Z.length}];for(let B=0,I=z.length;B<I;++B){let y=z[B],c=y.start,ZJ=y.count;for(let A=c,l=c+ZJ;A<l;A+=3)N(Z[A+0],Z[A+1],Z[A+2])}let w=new T,k=new T,L=new T,S=new T;function g(B){L.fromArray(W,B*3),S.copy(L);let I=q[B];w.copy(I),w.sub(L.multiplyScalar(L.dot(I))).normalize(),k.crossVectors(S,I);let c=k.dot(U[B])<0?-1:1;Y[B*4]=w.x,Y[B*4+1]=w.y,Y[B*4+2]=w.z,Y[B*4+3]=c}for(let B=0,I=z.length;B<I;++B){let y=z[B],c=y.start,ZJ=y.count;for(let A=c,l=c+ZJ;A<l;A+=3)g(Z[A+0]),g(Z[A+1]),g(Z[A+2])}}computeVertexNormals(){let J=this.index,$=this.getAttribute("position");if($!==void 0){let Z=this.getAttribute("normal");if(Z===void 0)Z=new Z7(new Float32Array($.count*3),3),this.setAttribute("normal",Z);else for(let E=0,V=Z.count;E<V;E++)Z.setXYZ(E,0,0,0);let Q=new T,W=new T,X=new T,H=new T,Y=new T,q=new T,U=new T,K=new T;if(J)for(let E=0,V=J.count;E<V;E+=3){let O=J.getX(E+0),_=J.getX(E+1),R=J.getX(E+2);Q.fromBufferAttribute($,O),W.fromBufferAttribute($,_),X.fromBufferAttribute($,R),U.subVectors(X,W),K.subVectors(Q,W),U.cross(K),H.fromBufferAttribute(Z,O),Y.fromBufferAttribute(Z,_),q.fromBufferAttribute(Z,R),H.add(U),Y.add(U),q.add(U),Z.setXYZ(O,H.x,H.y,H.z),Z.setXYZ(_,Y.x,Y.y,Y.z),Z.setXYZ(R,q.x,q.y,q.z)}else for(let E=0,V=$.count;E<V;E+=3)Q.fromBufferAttribute($,E+0),W.fromBufferAttribute($,E+1),X.fromBufferAttribute($,E+2),U.subVectors(X,W),K.subVectors(Q,W),U.cross(K),Z.setXYZ(E+0,U.x,U.y,U.z),Z.setXYZ(E+1,U.x,U.y,U.z),Z.setXYZ(E+2,U.x,U.y,U.z);this.normalizeNormals(),Z.needsUpdate=!0}}normalizeNormals(){let J=this.attributes.normal;for(let $=0,Z=J.count;$<Z;$++)z7.fromBufferAttribute(J,$),z7.normalize(),J.setXYZ($,z7.x,z7.y,z7.z)}toNonIndexed(){function J(H,Y){let{array:q,itemSize:U,normalized:K}=H,E=new q.constructor(Y.length*U),V=0,O=0;for(let _=0,R=Y.length;_<R;_++){if(H.isInterleavedBufferAttribute)V=Y[_]*H.data.stride+H.offset;else V=Y[_]*U;for(let F=0;F<U;F++)E[O++]=q[V++]}return new Z7(E,U,K)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let $=new E7,Z=this.index.array,Q=this.attributes;for(let H in Q){let Y=Q[H],q=J(Y,Z);$.setAttribute(H,q)}let W=this.morphAttributes;for(let H in W){let Y=[],q=W[H];for(let U=0,K=q.length;U<K;U++){let E=q[U],V=J(E,Z);Y.push(V)}$.morphAttributes[H]=Y}$.morphTargetsRelative=this.morphTargetsRelative;let X=this.groups;for(let H=0,Y=X.length;H<Y;H++){let q=X[H];$.addGroup(q.start,q.count,q.materialIndex)}return $}toJSON(){let J={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(J.uuid=this.uuid,J.type=this.type,this.name!=="")J.name=this.name;if(Object.keys(this.userData).length>0)J.userData=this.userData;if(this.parameters!==void 0){let Y=this.parameters;for(let q in Y)if(Y[q]!==void 0)J[q]=Y[q];return J}J.data={attributes:{}};let $=this.index;if($!==null)J.data.index={type:$.array.constructor.name,array:Array.prototype.slice.call($.array)};let Z=this.attributes;for(let Y in Z){let q=Z[Y];J.data.attributes[Y]=q.toJSON(J.data)}let Q={},W=!1;for(let Y in this.morphAttributes){let q=this.morphAttributes[Y],U=[];for(let K=0,E=q.length;K<E;K++){let V=q[K];U.push(V.toJSON(J.data))}if(U.length>0)Q[Y]=U,W=!0}if(W)J.data.morphAttributes=Q,J.data.morphTargetsRelative=this.morphTargetsRelative;let X=this.groups;if(X.length>0)J.data.groups=JSON.parse(JSON.stringify(X));let H=this.boundingSphere;if(H!==null)J.data.boundingSphere={center:H.center.toArray(),radius:H.radius};return J}clone(){return new this.constructor().copy(this)}copy(J){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let $={};this.name=J.name;let Z=J.index;if(Z!==null)this.setIndex(Z.clone($));let Q=J.attributes;for(let q in Q){let U=Q[q];this.setAttribute(q,U.clone($))}let W=J.morphAttributes;for(let q in W){let U=[],K=W[q];for(let E=0,V=K.length;E<V;E++)U.push(K[E].clone($));this.morphAttributes[q]=U}this.morphTargetsRelative=J.morphTargetsRelative;let X=J.groups;for(let q=0,U=X.length;q<U;q++){let K=X[q];this.addGroup(K.start,K.count,K.materialIndex)}let H=J.boundingBox;if(H!==null)this.boundingBox=H.clone();let Y=J.boundingSphere;if(Y!==null)this.boundingSphere=Y.clone();return this.drawRange.start=J.drawRange.start,this.drawRange.count=J.drawRange.count,this.userData=J.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}var i6=new AJ,A9=new x$,E0=new g7,o6=new T,o9=new T,a9=new T,r9=new T,O8=new T,V0=new T,G0=new yJ,F0=new yJ,O0=new yJ,a6=new T,r6=new T,t6=new T,R0=new T,_0=new T;class H7 extends $7{constructor(J=new E7,$=new f7){super();this.isMesh=!0,this.type="Mesh",this.geometry=J,this.material=$,this.updateMorphTargets()}copy(J,$){if(super.copy(J,$),J.morphTargetInfluences!==void 0)this.morphTargetInfluences=J.morphTargetInfluences.slice();if(J.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},J.morphTargetDictionary);return this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}updateMorphTargets(){let $=this.geometry.morphAttributes,Z=Object.keys($);if(Z.length>0){let Q=$[Z[0]];if(Q!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let W=0,X=Q.length;W<X;W++){let H=Q[W].name||String(W);this.morphTargetInfluences.push(0),this.morphTargetDictionary[H]=W}}}}getVertexPosition(J,$){let Z=this.geometry,Q=Z.attributes.position,W=Z.morphAttributes.position,X=Z.morphTargetsRelative;$.fromBufferAttribute(Q,J);let H=this.morphTargetInfluences;if(W&&H){V0.set(0,0,0);for(let Y=0,q=W.length;Y<q;Y++){let U=H[Y],K=W[Y];if(U===0)continue;if(O8.fromBufferAttribute(K,J),X)V0.addScaledVector(O8,U);else V0.addScaledVector(O8.sub($),U)}$.add(V0)}return $}raycast(J,$){let Z=this.geometry,Q=this.material,W=this.matrixWorld;if(Q===void 0)return;if(Z.boundingSphere===null)Z.computeBoundingSphere();if(E0.copy(Z.boundingSphere),E0.applyMatrix4(W),A9.copy(J.ray).recast(J.near),E0.containsPoint(A9.origin)===!1){if(A9.intersectSphere(E0,o6)===null)return;if(A9.origin.distanceToSquared(o6)>(J.far-J.near)**2)return}if(i6.copy(W).invert(),A9.copy(J.ray).applyMatrix4(i6),Z.boundingBox!==null){if(A9.intersectsBox(Z.boundingBox)===!1)return}this._computeIntersections(J,$,A9)}_computeIntersections(J,$,Z){let Q,W=this.geometry,X=this.material,H=W.index,Y=W.attributes.position,q=W.attributes.uv,U=W.attributes.uv1,K=W.attributes.normal,E=W.groups,V=W.drawRange;if(H!==null)if(Array.isArray(X))for(let O=0,_=E.length;O<_;O++){let R=E[O],F=X[R.materialIndex],G=Math.max(R.start,V.start),N=Math.min(H.count,Math.min(R.start+R.count,V.start+V.count));for(let z=G,w=N;z<w;z+=3){let k=H.getX(z),L=H.getX(z+1),S=H.getX(z+2);if(Q=N0(this,F,J,Z,q,U,K,k,L,S),Q)Q.faceIndex=Math.floor(z/3),Q.face.materialIndex=R.materialIndex,$.push(Q)}}else{let O=Math.max(0,V.start),_=Math.min(H.count,V.start+V.count);for(let R=O,F=_;R<F;R+=3){let G=H.getX(R),N=H.getX(R+1),z=H.getX(R+2);if(Q=N0(this,X,J,Z,q,U,K,G,N,z),Q)Q.faceIndex=Math.floor(R/3),$.push(Q)}}else if(Y!==void 0)if(Array.isArray(X))for(let O=0,_=E.length;O<_;O++){let R=E[O],F=X[R.materialIndex],G=Math.max(R.start,V.start),N=Math.min(Y.count,Math.min(R.start+R.count,V.start+V.count));for(let z=G,w=N;z<w;z+=3){let k=z,L=z+1,S=z+2;if(Q=N0(this,F,J,Z,q,U,K,k,L,S),Q)Q.faceIndex=Math.floor(z/3),Q.face.materialIndex=R.materialIndex,$.push(Q)}}else{let O=Math.max(0,V.start),_=Math.min(Y.count,V.start+V.count);for(let R=O,F=_;R<F;R+=3){let G=R,N=R+1,z=R+2;if(Q=N0(this,X,J,Z,q,U,K,G,N,z),Q)Q.faceIndex=Math.floor(R/3),$.push(Q)}}}}function UW(J,$,Z,Q,W,X,H,Y){let q;if($.side===1)q=Q.intersectTriangle(H,X,W,!0,Y);else q=Q.intersectTriangle(W,X,H,$.side===0,Y);if(q===null)return null;_0.copy(Y),_0.applyMatrix4(J.matrixWorld);let U=Z.ray.origin.distanceTo(_0);if(U<Z.near||U>Z.far)return null;return{distance:U,point:_0.clone(),object:J}}function N0(J,$,Z,Q,W,X,H,Y,q,U){J.getVertexPosition(Y,o9),J.getVertexPosition(q,a9),J.getVertexPosition(U,r9);let K=UW(J,$,Z,Q,o9,a9,r9,R0);if(K){if(W)G0.fromBufferAttribute(W,Y),F0.fromBufferAttribute(W,q),O0.fromBufferAttribute(W,U),K.uv=c7.getInterpolation(R0,o9,a9,r9,G0,F0,O0,new yJ);if(X)G0.fromBufferAttribute(X,Y),F0.fromBufferAttribute(X,q),O0.fromBufferAttribute(X,U),K.uv1=c7.getInterpolation(R0,o9,a9,r9,G0,F0,O0,new yJ),K.uv2=K.uv1;if(H){if(a6.fromBufferAttribute(H,Y),r6.fromBufferAttribute(H,q),t6.fromBufferAttribute(H,U),K.normal=c7.getInterpolation(R0,o9,a9,r9,a6,r6,t6,new T),K.normal.dot(Q.direction)>0)K.normal.multiplyScalar(-1)}let E={a:Y,b:q,c:U,normal:new T,materialIndex:0};c7.getNormal(o9,a9,r9,E.normal),K.face=E}return K}class v9 extends E7{constructor(J=1,$=1,Z=1,Q=1,W=1,X=1){super();this.type="BoxGeometry",this.parameters={width:J,height:$,depth:Z,widthSegments:Q,heightSegments:W,depthSegments:X};let H=this;Q=Math.floor(Q),W=Math.floor(W),X=Math.floor(X);let Y=[],q=[],U=[],K=[],E=0,V=0;O("z","y","x",-1,-1,Z,$,J,X,W,0),O("z","y","x",1,-1,Z,$,-J,X,W,1),O("x","z","y",1,1,J,Z,$,Q,X,2),O("x","z","y",1,-1,J,Z,-$,Q,X,3),O("x","y","z",1,-1,J,$,Z,Q,W,4),O("x","y","z",-1,-1,J,$,-Z,Q,W,5),this.setIndex(Y),this.setAttribute("position",new X7(q,3)),this.setAttribute("normal",new X7(U,3)),this.setAttribute("uv",new X7(K,2));function O(_,R,F,G,N,z,w,k,L,S,g){let B=z/L,I=w/S,y=z/2,c=w/2,ZJ=k/2,A=L+1,l=S+1,m=0,a=0,d=new T;for(let u=0;u<l;u++){let t=u*I-c;for(let e=0;e<A;e++){let x=e*B-y;d[_]=x*G,d[R]=t*N,d[F]=ZJ,q.push(d.x,d.y,d.z),d[_]=0,d[R]=0,d[F]=k>0?1:-1,U.push(d.x,d.y,d.z),K.push(e/L),K.push(1-u/S),m+=1}}for(let u=0;u<S;u++)for(let t=0;t<L;t++){let e=E+t+A*u,x=E+t+A*(u+1),s=E+(t+1)+A*(u+1),YJ=E+(t+1)+A*u;Y.push(e,x,YJ),Y.push(x,s,YJ),a+=6}H.addGroup(V,a,g),V+=a,E+=m}}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new v9(J.width,J.height,J.depth,J.widthSegments,J.heightSegments,J.depthSegments)}}function Y$(J){let $={};for(let Z in J){$[Z]={};for(let Q in J[Z]){let W=J[Z][Q];if(W&&(W.isColor||W.isMatrix3||W.isMatrix4||W.isVector2||W.isVector3||W.isVector4||W.isTexture||W.isQuaternion))if(W.isRenderTargetTexture)console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),$[Z][Q]=null;else $[Z][Q]=W.clone();else if(Array.isArray(W))$[Z][Q]=W.slice();else $[Z][Q]=W}}return $}function P7(J){let $={};for(let Z=0;Z<J.length;Z++){let Q=Y$(J[Z]);for(let W in Q)$[W]=Q[W]}return $}function KW(J){let $=[];for(let Z=0;Z<J.length;Z++)$.push(J[Z].clone());return $}function J5(J){if(J.getRenderTarget()===null)return J.outputColorSpace;return iJ.workingColorSpace}var EW={clone:Y$,merge:P7},VW=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,GW=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class _9 extends x7{constructor(J){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=VW,this.fragmentShader=GW,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,J!==void 0)this.setValues(J)}copy(J){return super.copy(J),this.fragmentShader=J.fragmentShader,this.vertexShader=J.vertexShader,this.uniforms=Y$(J.uniforms),this.uniformsGroups=KW(J.uniformsGroups),this.defines=Object.assign({},J.defines),this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.fog=J.fog,this.lights=J.lights,this.clipping=J.clipping,this.extensions=Object.assign({},J.extensions),this.glslVersion=J.glslVersion,this}toJSON(J){let $=super.toJSON(J);$.glslVersion=this.glslVersion,$.uniforms={};for(let Q in this.uniforms){let X=this.uniforms[Q].value;if(X&&X.isTexture)$.uniforms[Q]={type:"t",value:X.toJSON(J).uuid};else if(X&&X.isColor)$.uniforms[Q]={type:"c",value:X.getHex()};else if(X&&X.isVector2)$.uniforms[Q]={type:"v2",value:X.toArray()};else if(X&&X.isVector3)$.uniforms[Q]={type:"v3",value:X.toArray()};else if(X&&X.isVector4)$.uniforms[Q]={type:"v4",value:X.toArray()};else if(X&&X.isMatrix3)$.uniforms[Q]={type:"m3",value:X.toArray()};else if(X&&X.isMatrix4)$.uniforms[Q]={type:"m4",value:X.toArray()};else $.uniforms[Q]={value:X}}if(Object.keys(this.defines).length>0)$.defines=this.defines;$.vertexShader=this.vertexShader,$.fragmentShader=this.fragmentShader,$.lights=this.lights,$.clipping=this.clipping;let Z={};for(let Q in this.extensions)if(this.extensions[Q]===!0)Z[Q]=!0;if(Object.keys(Z).length>0)$.extensions=Z;return $}}class l8 extends $7{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new AJ,this.projectionMatrix=new AJ,this.projectionMatrixInverse=new AJ,this.coordinateSystem=2000}copy(J,$){return super.copy(J,$),this.matrixWorldInverse.copy(J.matrixWorldInverse),this.projectionMatrix.copy(J.projectionMatrix),this.projectionMatrixInverse.copy(J.projectionMatrixInverse),this.coordinateSystem=J.coordinateSystem,this}getWorldDirection(J){return super.getWorldDirection(J).negate()}updateMatrixWorld(J){super.updateMatrixWorld(J),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(J,$){super.updateWorldMatrix(J,$),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class M7 extends l8{constructor(J=50,$=1,Z=0.1,Q=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=J,this.zoom=1,this.near=Z,this.far=Q,this.focus=10,this.aspect=$,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(J,$){return super.copy(J,$),this.fov=J.fov,this.zoom=J.zoom,this.near=J.near,this.far=J.far,this.focus=J.focus,this.aspect=J.aspect,this.view=J.view===null?null:Object.assign({},J.view),this.filmGauge=J.filmGauge,this.filmOffset=J.filmOffset,this}setFocalLength(J){let $=0.5*this.getFilmHeight()/J;this.fov=X$*2*Math.atan($),this.updateProjectionMatrix()}getFocalLength(){let J=Math.tan(I$*0.5*this.fov);return 0.5*this.getFilmHeight()/J}getEffectiveFOV(){return X$*2*Math.atan(Math.tan(I$*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(J,$,Z,Q,W,X){if(this.aspect=J/$,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=J,this.view.fullHeight=$,this.view.offsetX=Z,this.view.offsetY=Q,this.view.width=W,this.view.height=X,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let J=this.near,$=J*Math.tan(I$*0.5*this.fov)/this.zoom,Z=2*$,Q=this.aspect*Z,W=-0.5*Q,X=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:Y,fullHeight:q}=X;W+=X.offsetX*Q/Y,$-=X.offsetY*Z/q,Q*=X.width/Y,Z*=X.height/q}let H=this.filmOffset;if(H!==0)W+=J*H/this.getFilmWidth();this.projectionMatrix.makePerspective(W,W+Q,$,$-Z,J,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(J){let $=super.toJSON(J);if($.object.fov=this.fov,$.object.zoom=this.zoom,$.object.near=this.near,$.object.far=this.far,$.object.focus=this.focus,$.object.aspect=this.aspect,this.view!==null)$.object.view=Object.assign({},this.view);return $.object.filmGauge=this.filmGauge,$.object.filmOffset=this.filmOffset,$}}var t9=-90,e9=1;class $5 extends $7{constructor(J,$,Z){super();this.type="CubeCamera",this.renderTarget=Z,this.coordinateSystem=null,this.activeMipmapLevel=0;let Q=new M7(t9,e9,J,$);Q.layers=this.layers,this.add(Q);let W=new M7(t9,e9,J,$);W.layers=this.layers,this.add(W);let X=new M7(t9,e9,J,$);X.layers=this.layers,this.add(X);let H=new M7(t9,e9,J,$);H.layers=this.layers,this.add(H);let Y=new M7(t9,e9,J,$);Y.layers=this.layers,this.add(Y);let q=new M7(t9,e9,J,$);q.layers=this.layers,this.add(q)}updateCoordinateSystem(){let J=this.coordinateSystem,$=this.children.concat(),[Z,Q,W,X,H,Y]=$;for(let q of $)this.remove(q);if(J===2000)Z.up.set(0,1,0),Z.lookAt(1,0,0),Q.up.set(0,1,0),Q.lookAt(-1,0,0),W.up.set(0,0,-1),W.lookAt(0,1,0),X.up.set(0,0,1),X.lookAt(0,-1,0),H.up.set(0,1,0),H.lookAt(0,0,1),Y.up.set(0,1,0),Y.lookAt(0,0,-1);else if(J===2001)Z.up.set(0,-1,0),Z.lookAt(-1,0,0),Q.up.set(0,-1,0),Q.lookAt(1,0,0),W.up.set(0,0,1),W.lookAt(0,1,0),X.up.set(0,0,-1),X.lookAt(0,-1,0),H.up.set(0,-1,0),H.lookAt(0,0,1),Y.up.set(0,-1,0),Y.lookAt(0,0,-1);else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+J);for(let q of $)this.add(q),q.updateMatrixWorld()}update(J,$){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:Z,activeMipmapLevel:Q}=this;if(this.coordinateSystem!==J.coordinateSystem)this.coordinateSystem=J.coordinateSystem,this.updateCoordinateSystem();let[W,X,H,Y,q,U]=this.children,K=J.getRenderTarget(),E=J.getActiveCubeFace(),V=J.getActiveMipmapLevel(),O=J.xr.enabled;J.xr.enabled=!1;let _=Z.texture.generateMipmaps;Z.texture.generateMipmaps=!1,J.setRenderTarget(Z,0,Q),J.render($,W),J.setRenderTarget(Z,1,Q),J.render($,X),J.setRenderTarget(Z,2,Q),J.render($,H),J.setRenderTarget(Z,3,Q),J.render($,Y),J.setRenderTarget(Z,4,Q),J.render($,q),Z.texture.generateMipmaps=_,J.setRenderTarget(Z,5,Q),J.render($,U),J.setRenderTarget(K,E,V),J.xr.enabled=O,Z.texture.needsPMREMUpdate=!0}}class u8 extends O7{constructor(J,$,Z,Q,W,X,H,Y,q,U){J=J!==void 0?J:[],$=$!==void 0?$:301;super(J,$,Z,Q,W,X,H,Y,q,U);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(J){this.image=J}}class Z5 extends R9{constructor(J=1,$={}){super(J,J,$);this.isWebGLCubeRenderTarget=!0;let Z={width:J,height:J,depth:1},Q=[Z,Z,Z,Z,Z,Z];if($.encoding!==void 0)P$("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),$.colorSpace=$.encoding===3001?"srgb":"";this.texture=new u8(Q,$.mapping,$.wrapS,$.wrapT,$.magFilter,$.minFilter,$.format,$.type,$.anisotropy,$.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=$.generateMipmaps!==void 0?$.generateMipmaps:!1,this.texture.minFilter=$.minFilter!==void 0?$.minFilter:1006}fromEquirectangularTexture(J,$){this.texture.type=$.type,this.texture.colorSpace=$.colorSpace,this.texture.generateMipmaps=$.generateMipmaps,this.texture.minFilter=$.minFilter,this.texture.magFilter=$.magFilter;let Z={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},Q=new v9(5,5,5),W=new _9({name:"CubemapFromEquirect",uniforms:Y$(Z.uniforms),vertexShader:Z.vertexShader,fragmentShader:Z.fragmentShader,side:1,blending:0});W.uniforms.tEquirect.value=$;let X=new H7(Q,W),H=$.minFilter;if($.minFilter===1008)$.minFilter=1006;return new $5(1,10,this).update(J,X),$.minFilter=H,X.geometry.dispose(),X.material.dispose(),this}clear(J,$,Z,Q){let W=J.getRenderTarget();for(let X=0;X<6;X++)J.setRenderTarget(this,X),J.clear($,Z,Q);J.setRenderTarget(W)}}var R8=new T,FW=new T,OW=new hJ;class F9{constructor(J=new T(1,0,0),$=0){this.isPlane=!0,this.normal=J,this.constant=$}set(J,$){return this.normal.copy(J),this.constant=$,this}setComponents(J,$,Z,Q){return this.normal.set(J,$,Z),this.constant=Q,this}setFromNormalAndCoplanarPoint(J,$){return this.normal.copy(J),this.constant=-$.dot(this.normal),this}setFromCoplanarPoints(J,$,Z){let Q=R8.subVectors(Z,$).cross(FW.subVectors(J,$)).normalize();return this.setFromNormalAndCoplanarPoint(Q,J),this}copy(J){return this.normal.copy(J.normal),this.constant=J.constant,this}normalize(){let J=1/this.normal.length();return this.normal.multiplyScalar(J),this.constant*=J,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(J){return this.normal.dot(J)+this.constant}distanceToSphere(J){return this.distanceToPoint(J.center)-J.radius}projectPoint(J,$){return $.copy(J).addScaledVector(this.normal,-this.distanceToPoint(J))}intersectLine(J,$){let Z=J.delta(R8),Q=this.normal.dot(Z);if(Q===0){if(this.distanceToPoint(J.start)===0)return $.copy(J.start);return null}let W=-(J.start.dot(this.normal)+this.constant)/Q;if(W<0||W>1)return null;return $.copy(J.start).addScaledVector(Z,W)}intersectsLine(J){let $=this.distanceToPoint(J.start),Z=this.distanceToPoint(J.end);return $<0&&Z>0||Z<0&&$>0}intersectsBox(J){return J.intersectsPlane(this)}intersectsSphere(J){return J.intersectsPlane(this)}coplanarPoint(J){return J.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(J,$){let Z=$||OW.getNormalMatrix(J),Q=this.coplanarPoint(R8).applyMatrix4(J),W=this.normal.applyMatrix3(Z).normalize();return this.constant=-Q.dot(W),this}translate(J){return this.constant-=J.dot(this.normal),this}equals(J){return J.normal.equals(this.normal)&&J.constant===this.constant}clone(){return new this.constructor().copy(this)}}var T9=new g7,z0=new T;class j0{constructor(J=new F9,$=new F9,Z=new F9,Q=new F9,W=new F9,X=new F9){this.planes=[J,$,Z,Q,W,X]}set(J,$,Z,Q,W,X){let H=this.planes;return H[0].copy(J),H[1].copy($),H[2].copy(Z),H[3].copy(Q),H[4].copy(W),H[5].copy(X),this}copy(J){let $=this.planes;for(let Z=0;Z<6;Z++)$[Z].copy(J.planes[Z]);return this}setFromProjectionMatrix(J,$=2000){let Z=this.planes,Q=J.elements,W=Q[0],X=Q[1],H=Q[2],Y=Q[3],q=Q[4],U=Q[5],K=Q[6],E=Q[7],V=Q[8],O=Q[9],_=Q[10],R=Q[11],F=Q[12],G=Q[13],N=Q[14],z=Q[15];if(Z[0].setComponents(Y-W,E-q,R-V,z-F).normalize(),Z[1].setComponents(Y+W,E+q,R+V,z+F).normalize(),Z[2].setComponents(Y+X,E+U,R+O,z+G).normalize(),Z[3].setComponents(Y-X,E-U,R-O,z-G).normalize(),Z[4].setComponents(Y-H,E-K,R-_,z-N).normalize(),$===2000)Z[5].setComponents(Y+H,E+K,R+_,z+N).normalize();else if($===2001)Z[5].setComponents(H,K,_,N).normalize();else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+$);return this}intersectsObject(J){if(J.boundingSphere!==void 0){if(J.boundingSphere===null)J.computeBoundingSphere();T9.copy(J.boundingSphere).applyMatrix4(J.matrixWorld)}else{let $=J.geometry;if($.boundingSphere===null)$.computeBoundingSphere();T9.copy($.boundingSphere).applyMatrix4(J.matrixWorld)}return this.intersectsSphere(T9)}intersectsSprite(J){return T9.center.set(0,0,0),T9.radius=0.7071067811865476,T9.applyMatrix4(J.matrixWorld),this.intersectsSphere(T9)}intersectsSphere(J){let $=this.planes,Z=J.center,Q=-J.radius;for(let W=0;W<6;W++)if($[W].distanceToPoint(Z)<Q)return!1;return!0}intersectsBox(J){let $=this.planes;for(let Z=0;Z<6;Z++){let Q=$[Z];if(z0.x=Q.normal.x>0?J.max.x:J.min.x,z0.y=Q.normal.y>0?J.max.y:J.min.y,z0.z=Q.normal.z>0?J.max.z:J.min.z,Q.distanceToPoint(z0)<0)return!1}return!0}containsPoint(J){let $=this.planes;for(let Z=0;Z<6;Z++)if($[Z].distanceToPoint(J)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Q5(){let J=null,$=!1,Z=null,Q=null;function W(X,H){Z(X,H),Q=J.requestAnimationFrame(W)}return{start:function(){if($===!0)return;if(Z===null)return;Q=J.requestAnimationFrame(W),$=!0},stop:function(){J.cancelAnimationFrame(Q),$=!1},setAnimationLoop:function(X){Z=X},setContext:function(X){J=X}}}function RW(J,$){let Z=$.isWebGL2,Q=new WeakMap;function W(U,K){let{array:E,usage:V}=U,O=E.byteLength,_=J.createBuffer();J.bindBuffer(K,_),J.bufferData(K,E,V),U.onUploadCallback();let R;if(E instanceof Float32Array)R=J.FLOAT;else if(E instanceof Uint16Array)if(U.isFloat16BufferAttribute)if(Z)R=J.HALF_FLOAT;else throw Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else R=J.UNSIGNED_SHORT;else if(E instanceof Int16Array)R=J.SHORT;else if(E instanceof Uint32Array)R=J.UNSIGNED_INT;else if(E instanceof Int32Array)R=J.INT;else if(E instanceof Int8Array)R=J.BYTE;else if(E instanceof Uint8Array)R=J.UNSIGNED_BYTE;else if(E instanceof Uint8ClampedArray)R=J.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+E);return{buffer:_,type:R,bytesPerElement:E.BYTES_PER_ELEMENT,version:U.version,size:O}}function X(U,K,E){let{array:V,_updateRange:O,updateRanges:_}=K;if(J.bindBuffer(E,U),O.count===-1&&_.length===0)J.bufferSubData(E,0,V);if(_.length!==0){for(let R=0,F=_.length;R<F;R++){let G=_[R];if(Z)J.bufferSubData(E,G.start*V.BYTES_PER_ELEMENT,V,G.start,G.count);else J.bufferSubData(E,G.start*V.BYTES_PER_ELEMENT,V.subarray(G.start,G.start+G.count))}K.clearUpdateRanges()}if(O.count!==-1){if(Z)J.bufferSubData(E,O.offset*V.BYTES_PER_ELEMENT,V,O.offset,O.count);else J.bufferSubData(E,O.offset*V.BYTES_PER_ELEMENT,V.subarray(O.offset,O.offset+O.count));O.count=-1}K.onUploadCallback()}function H(U){if(U.isInterleavedBufferAttribute)U=U.data;return Q.get(U)}function Y(U){if(U.isInterleavedBufferAttribute)U=U.data;let K=Q.get(U);if(K)J.deleteBuffer(K.buffer),Q.delete(U)}function q(U,K){if(U.isGLBufferAttribute){let V=Q.get(U);if(!V||V.version<U.version)Q.set(U,{buffer:U.buffer,type:U.type,bytesPerElement:U.elementSize,version:U.version});return}if(U.isInterleavedBufferAttribute)U=U.data;let E=Q.get(U);if(E===void 0)Q.set(U,W(U,K));else if(E.version<U.version){if(E.size!==U.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");X(E.buffer,U,K),E.version=U.version}}return{get:H,remove:Y,update:q}}class U$ extends E7{constructor(J=1,$=1,Z=1,Q=1){super();this.type="PlaneGeometry",this.parameters={width:J,height:$,widthSegments:Z,heightSegments:Q};let W=J/2,X=$/2,H=Math.floor(Z),Y=Math.floor(Q),q=H+1,U=Y+1,K=J/H,E=$/Y,V=[],O=[],_=[],R=[];for(let F=0;F<U;F++){let G=F*E-X;for(let N=0;N<q;N++){let z=N*K-W;O.push(z,-G,0),_.push(0,0,1),R.push(N/H),R.push(1-F/Y)}}for(let F=0;F<Y;F++)for(let G=0;G<H;G++){let N=G+q*F,z=G+q*(F+1),w=G+1+q*(F+1),k=G+1+q*F;V.push(N,z,k),V.push(z,w,k)}this.setIndex(V),this.setAttribute("position",new X7(O,3)),this.setAttribute("normal",new X7(_,3)),this.setAttribute("uv",new X7(R,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new U$(J.width,J.height,J.widthSegments,J.heightSegments)}}var _W=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,NW=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,zW=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,MW=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,BW=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,DW=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,LW=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,CW=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,wW=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,IW=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,kW=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,PW=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,AW=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,TW=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,SW=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,jW=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,vW=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yW=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,xW=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,fW=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,hW=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,bW=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,gW=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,pW=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,lW=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,uW=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,mW=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,dW=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,cW=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,nW=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,sW="gl_FragColor = linearToOutputTexel( gl_FragColor );",iW=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,oW=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,aW=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,rW=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,tW=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,eW=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,JX=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,$X=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ZX=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,QX=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,WX=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,XX=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,YX=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,HX=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,qX=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,UX=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,KX=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,EX=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,VX=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,GX=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,FX=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,OX=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,RX=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,_X=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,NX=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,zX=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,MX=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,BX=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,DX=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,LX=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,CX=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,wX=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,IX=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,kX=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,PX=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,AX=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,TX=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,SX=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,jX=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,vX=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,yX=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,xX=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,fX=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hX=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bX=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,gX=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,pX=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,lX=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,uX=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,mX=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,dX=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,cX=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,nX=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,sX=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,iX=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,oX=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,aX=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,rX=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,tX=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,eX=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,JY=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,$Y=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ZY=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,QY=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,WY=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,XY=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,YY=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,HY=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,qY=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,UY=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,KY=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,EY=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,VY=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,GY=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,FY=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,OY=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,RY=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,_Y=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,NY=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zY=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,MY=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,BY=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,DY=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,LY=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,CY=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,wY=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,IY=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,kY=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,PY=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,AY=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,TY=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,SY=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jY=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vY=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yY=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,xY=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fY=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,hY=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,bY=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gY=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pY=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,lY=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,uY=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mY=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dY=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,cY=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,nY=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,sY=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,iY=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,oY=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,jJ={alphahash_fragment:_W,alphahash_pars_fragment:NW,alphamap_fragment:zW,alphamap_pars_fragment:MW,alphatest_fragment:BW,alphatest_pars_fragment:DW,aomap_fragment:LW,aomap_pars_fragment:CW,batching_pars_vertex:wW,batching_vertex:IW,begin_vertex:kW,beginnormal_vertex:PW,bsdfs:AW,iridescence_fragment:TW,bumpmap_pars_fragment:SW,clipping_planes_fragment:jW,clipping_planes_pars_fragment:vW,clipping_planes_pars_vertex:yW,clipping_planes_vertex:xW,color_fragment:fW,color_pars_fragment:hW,color_pars_vertex:bW,color_vertex:gW,common:pW,cube_uv_reflection_fragment:lW,defaultnormal_vertex:uW,displacementmap_pars_vertex:mW,displacementmap_vertex:dW,emissivemap_fragment:cW,emissivemap_pars_fragment:nW,colorspace_fragment:sW,colorspace_pars_fragment:iW,envmap_fragment:oW,envmap_common_pars_fragment:aW,envmap_pars_fragment:rW,envmap_pars_vertex:tW,envmap_physical_pars_fragment:KX,envmap_vertex:eW,fog_vertex:JX,fog_pars_vertex:$X,fog_fragment:ZX,fog_pars_fragment:QX,gradientmap_pars_fragment:WX,lightmap_fragment:XX,lightmap_pars_fragment:YX,lights_lambert_fragment:HX,lights_lambert_pars_fragment:qX,lights_pars_begin:UX,lights_toon_fragment:EX,lights_toon_pars_fragment:VX,lights_phong_fragment:GX,lights_phong_pars_fragment:FX,lights_physical_fragment:OX,lights_physical_pars_fragment:RX,lights_fragment_begin:_X,lights_fragment_maps:NX,lights_fragment_end:zX,logdepthbuf_fragment:MX,logdepthbuf_pars_fragment:BX,logdepthbuf_pars_vertex:DX,logdepthbuf_vertex:LX,map_fragment:CX,map_pars_fragment:wX,map_particle_fragment:IX,map_particle_pars_fragment:kX,metalnessmap_fragment:PX,metalnessmap_pars_fragment:AX,morphcolor_vertex:TX,morphnormal_vertex:SX,morphtarget_pars_vertex:jX,morphtarget_vertex:vX,normal_fragment_begin:yX,normal_fragment_maps:xX,normal_pars_fragment:fX,normal_pars_vertex:hX,normal_vertex:bX,normalmap_pars_fragment:gX,clearcoat_normal_fragment_begin:pX,clearcoat_normal_fragment_maps:lX,clearcoat_pars_fragment:uX,iridescence_pars_fragment:mX,opaque_fragment:dX,packing:cX,premultiplied_alpha_fragment:nX,project_vertex:sX,dithering_fragment:iX,dithering_pars_fragment:oX,roughnessmap_fragment:aX,roughnessmap_pars_fragment:rX,shadowmap_pars_fragment:tX,shadowmap_pars_vertex:eX,shadowmap_vertex:JY,shadowmask_pars_fragment:$Y,skinbase_vertex:ZY,skinning_pars_vertex:QY,skinning_vertex:WY,skinnormal_vertex:XY,specularmap_fragment:YY,specularmap_pars_fragment:HY,tonemapping_fragment:qY,tonemapping_pars_fragment:UY,transmission_fragment:KY,transmission_pars_fragment:EY,uv_pars_fragment:VY,uv_pars_vertex:GY,uv_vertex:FY,worldpos_vertex:OY,background_vert:RY,background_frag:_Y,backgroundCube_vert:NY,backgroundCube_frag:zY,cube_vert:MY,cube_frag:BY,depth_vert:DY,depth_frag:LY,distanceRGBA_vert:CY,distanceRGBA_frag:wY,equirect_vert:IY,equirect_frag:kY,linedashed_vert:PY,linedashed_frag:AY,meshbasic_vert:TY,meshbasic_frag:SY,meshlambert_vert:jY,meshlambert_frag:vY,meshmatcap_vert:yY,meshmatcap_frag:xY,meshnormal_vert:fY,meshnormal_frag:hY,meshphong_vert:bY,meshphong_frag:gY,meshphysical_vert:pY,meshphysical_frag:lY,meshtoon_vert:uY,meshtoon_frag:mY,points_vert:dY,points_frag:cY,shadow_vert:nY,shadow_frag:sY,sprite_vert:iY,sprite_frag:oY},$J={common:{diffuse:{value:new GJ(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new hJ},alphaMap:{value:null},alphaMapTransform:{value:new hJ},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new hJ}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new hJ}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new hJ}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new hJ},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new hJ},normalScale:{value:new yJ(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new hJ},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new hJ}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new hJ}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new hJ}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new GJ(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new GJ(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new hJ},alphaTest:{value:0},uvTransform:{value:new hJ}},sprite:{diffuse:{value:new GJ(16777215)},opacity:{value:1},center:{value:new yJ(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new hJ},alphaMap:{value:null},alphaMapTransform:{value:new hJ},alphaTest:{value:0}}},r7={basic:{uniforms:P7([$J.common,$J.specularmap,$J.envmap,$J.aomap,$J.lightmap,$J.fog]),vertexShader:jJ.meshbasic_vert,fragmentShader:jJ.meshbasic_frag},lambert:{uniforms:P7([$J.common,$J.specularmap,$J.envmap,$J.aomap,$J.lightmap,$J.emissivemap,$J.bumpmap,$J.normalmap,$J.displacementmap,$J.fog,$J.lights,{emissive:{value:new GJ(0)}}]),vertexShader:jJ.meshlambert_vert,fragmentShader:jJ.meshlambert_frag},phong:{uniforms:P7([$J.common,$J.specularmap,$J.envmap,$J.aomap,$J.lightmap,$J.emissivemap,$J.bumpmap,$J.normalmap,$J.displacementmap,$J.fog,$J.lights,{emissive:{value:new GJ(0)},specular:{value:new GJ(1118481)},shininess:{value:30}}]),vertexShader:jJ.meshphong_vert,fragmentShader:jJ.meshphong_frag},standard:{uniforms:P7([$J.common,$J.envmap,$J.aomap,$J.lightmap,$J.emissivemap,$J.bumpmap,$J.normalmap,$J.displacementmap,$J.roughnessmap,$J.metalnessmap,$J.fog,$J.lights,{emissive:{value:new GJ(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:jJ.meshphysical_vert,fragmentShader:jJ.meshphysical_frag},toon:{uniforms:P7([$J.common,$J.aomap,$J.lightmap,$J.emissivemap,$J.bumpmap,$J.normalmap,$J.displacementmap,$J.gradientmap,$J.fog,$J.lights,{emissive:{value:new GJ(0)}}]),vertexShader:jJ.meshtoon_vert,fragmentShader:jJ.meshtoon_frag},matcap:{uniforms:P7([$J.common,$J.bumpmap,$J.normalmap,$J.displacementmap,$J.fog,{matcap:{value:null}}]),vertexShader:jJ.meshmatcap_vert,fragmentShader:jJ.meshmatcap_frag},points:{uniforms:P7([$J.points,$J.fog]),vertexShader:jJ.points_vert,fragmentShader:jJ.points_frag},dashed:{uniforms:P7([$J.common,$J.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:jJ.linedashed_vert,fragmentShader:jJ.linedashed_frag},depth:{uniforms:P7([$J.common,$J.displacementmap]),vertexShader:jJ.depth_vert,fragmentShader:jJ.depth_frag},normal:{uniforms:P7([$J.common,$J.bumpmap,$J.normalmap,$J.displacementmap,{opacity:{value:1}}]),vertexShader:jJ.meshnormal_vert,fragmentShader:jJ.meshnormal_frag},sprite:{uniforms:P7([$J.sprite,$J.fog]),vertexShader:jJ.sprite_vert,fragmentShader:jJ.sprite_frag},background:{uniforms:{uvTransform:{value:new hJ},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:jJ.background_vert,fragmentShader:jJ.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:jJ.backgroundCube_vert,fragmentShader:jJ.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:jJ.cube_vert,fragmentShader:jJ.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:jJ.equirect_vert,fragmentShader:jJ.equirect_frag},distanceRGBA:{uniforms:P7([$J.common,$J.displacementmap,{referencePosition:{value:new T},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:jJ.distanceRGBA_vert,fragmentShader:jJ.distanceRGBA_frag},shadow:{uniforms:P7([$J.lights,$J.fog,{color:{value:new GJ(0)},opacity:{value:1}}]),vertexShader:jJ.shadow_vert,fragmentShader:jJ.shadow_frag}};r7.physical={uniforms:P7([r7.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new hJ},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new hJ},clearcoatNormalScale:{value:new yJ(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new hJ},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new hJ},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new hJ},sheen:{value:0},sheenColor:{value:new GJ(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new hJ},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new hJ},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new hJ},transmissionSamplerSize:{value:new yJ},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new hJ},attenuationDistance:{value:0},attenuationColor:{value:new GJ(0)},specularColor:{value:new GJ(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new hJ},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new hJ},anisotropyVector:{value:new yJ},anisotropyMap:{value:null},anisotropyMapTransform:{value:new hJ}}]),vertexShader:jJ.meshphysical_vert,fragmentShader:jJ.meshphysical_frag};var M0={r:0,b:0,g:0};function aY(J,$,Z,Q,W,X,H){let Y=new GJ(0),q=X===!0?0:1,U,K,E=null,V=0,O=null;function _(F,G){let N=!1,z=G.isScene===!0?G.background:null;if(z&&z.isTexture)z=(G.backgroundBlurriness>0?Z:$).get(z);if(z===null)R(Y,q);else if(z&&z.isColor)R(z,1),N=!0;let w=J.xr.getEnvironmentBlendMode();if(w==="additive")Q.buffers.color.setClear(0,0,0,1,H);else if(w==="alpha-blend")Q.buffers.color.setClear(0,0,0,0,H);if(J.autoClear||N)J.clear(J.autoClearColor,J.autoClearDepth,J.autoClearStencil);if(z&&(z.isCubeTexture||z.mapping===306)){if(K===void 0)K=new H7(new v9(1,1,1),new _9({name:"BackgroundCubeMaterial",uniforms:Y$(r7.backgroundCube.uniforms),vertexShader:r7.backgroundCube.vertexShader,fragmentShader:r7.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),K.geometry.deleteAttribute("normal"),K.geometry.deleteAttribute("uv"),K.onBeforeRender=function(k,L,S){this.matrixWorld.copyPosition(S.matrixWorld)},Object.defineProperty(K.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),W.update(K);if(K.material.uniforms.envMap.value=z,K.material.uniforms.flipEnvMap.value=z.isCubeTexture&&z.isRenderTargetTexture===!1?-1:1,K.material.uniforms.backgroundBlurriness.value=G.backgroundBlurriness,K.material.uniforms.backgroundIntensity.value=G.backgroundIntensity,K.material.toneMapped=iJ.getTransfer(z.colorSpace)!=="srgb",E!==z||V!==z.version||O!==J.toneMapping)K.material.needsUpdate=!0,E=z,V=z.version,O=J.toneMapping;K.layers.enableAll(),F.unshift(K,K.geometry,K.material,0,0,null)}else if(z&&z.isTexture){if(U===void 0)U=new H7(new U$(2,2),new _9({name:"BackgroundMaterial",uniforms:Y$(r7.background.uniforms),vertexShader:r7.background.vertexShader,fragmentShader:r7.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),U.geometry.deleteAttribute("normal"),Object.defineProperty(U.material,"map",{get:function(){return this.uniforms.t2D.value}}),W.update(U);if(U.material.uniforms.t2D.value=z,U.material.uniforms.backgroundIntensity.value=G.backgroundIntensity,U.material.toneMapped=iJ.getTransfer(z.colorSpace)!=="srgb",z.matrixAutoUpdate===!0)z.updateMatrix();if(U.material.uniforms.uvTransform.value.copy(z.matrix),E!==z||V!==z.version||O!==J.toneMapping)U.material.needsUpdate=!0,E=z,V=z.version,O=J.toneMapping;U.layers.enableAll(),F.unshift(U,U.geometry,U.material,0,0,null)}}function R(F,G){F.getRGB(M0,J5(J)),Q.buffers.color.setClear(M0.r,M0.g,M0.b,G,H)}return{getClearColor:function(){return Y},setClearColor:function(F,G=1){Y.set(F),q=G,R(Y,q)},getClearAlpha:function(){return q},setClearAlpha:function(F){q=F,R(Y,q)},render:_}}function rY(J,$,Z,Q){let W=J.getParameter(J.MAX_VERTEX_ATTRIBS),X=Q.isWebGL2?null:$.get("OES_vertex_array_object"),H=Q.isWebGL2||X!==null,Y={},q=F(null),U=q,K=!1;function E(A,l,m,a,d){let u=!1;if(H){let t=R(a,m,l);if(U!==t)U=t,O(U.object);if(u=G(A,a,m,d),u)N(A,a,m,d)}else{let t=l.wireframe===!0;if(U.geometry!==a.id||U.program!==m.id||U.wireframe!==t)U.geometry=a.id,U.program=m.id,U.wireframe=t,u=!0}if(d!==null)Z.update(d,J.ELEMENT_ARRAY_BUFFER);if(u||K){if(K=!1,g(A,l,m,a),d!==null)J.bindBuffer(J.ELEMENT_ARRAY_BUFFER,Z.get(d).buffer)}}function V(){if(Q.isWebGL2)return J.createVertexArray();return X.createVertexArrayOES()}function O(A){if(Q.isWebGL2)return J.bindVertexArray(A);return X.bindVertexArrayOES(A)}function _(A){if(Q.isWebGL2)return J.deleteVertexArray(A);return X.deleteVertexArrayOES(A)}function R(A,l,m){let a=m.wireframe===!0,d=Y[A.id];if(d===void 0)d={},Y[A.id]=d;let u=d[l.id];if(u===void 0)u={},d[l.id]=u;let t=u[a];if(t===void 0)t=F(V()),u[a]=t;return t}function F(A){let l=[],m=[],a=[];for(let d=0;d<W;d++)l[d]=0,m[d]=0,a[d]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:l,enabledAttributes:m,attributeDivisors:a,object:A,attributes:{},index:null}}function G(A,l,m,a){let d=U.attributes,u=l.attributes,t=0,e=m.getAttributes();for(let x in e)if(e[x].location>=0){let YJ=d[x],HJ=u[x];if(HJ===void 0){if(x==="instanceMatrix"&&A.instanceMatrix)HJ=A.instanceMatrix;if(x==="instanceColor"&&A.instanceColor)HJ=A.instanceColor}if(YJ===void 0)return!0;if(YJ.attribute!==HJ)return!0;if(HJ&&YJ.data!==HJ.data)return!0;t++}if(U.attributesNum!==t)return!0;if(U.index!==a)return!0;return!1}function N(A,l,m,a){let d={},u=l.attributes,t=0,e=m.getAttributes();for(let x in e)if(e[x].location>=0){let YJ=u[x];if(YJ===void 0){if(x==="instanceMatrix"&&A.instanceMatrix)YJ=A.instanceMatrix;if(x==="instanceColor"&&A.instanceColor)YJ=A.instanceColor}let HJ={};if(HJ.attribute=YJ,YJ&&YJ.data)HJ.data=YJ.data;d[x]=HJ,t++}U.attributes=d,U.attributesNum=t,U.index=a}function z(){let A=U.newAttributes;for(let l=0,m=A.length;l<m;l++)A[l]=0}function w(A){k(A,0)}function k(A,l){let{newAttributes:m,enabledAttributes:a,attributeDivisors:d}=U;if(m[A]=1,a[A]===0)J.enableVertexAttribArray(A),a[A]=1;if(d[A]!==l)(Q.isWebGL2?J:$.get("ANGLE_instanced_arrays"))[Q.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](A,l),d[A]=l}function L(){let{newAttributes:A,enabledAttributes:l}=U;for(let m=0,a=l.length;m<a;m++)if(l[m]!==A[m])J.disableVertexAttribArray(m),l[m]=0}function S(A,l,m,a,d,u,t){if(t===!0)J.vertexAttribIPointer(A,l,m,d,u);else J.vertexAttribPointer(A,l,m,a,d,u)}function g(A,l,m,a){if(Q.isWebGL2===!1&&(A.isInstancedMesh||a.isInstancedBufferGeometry)){if($.get("ANGLE_instanced_arrays")===null)return}z();let d=a.attributes,u=m.getAttributes(),t=l.defaultAttributeValues;for(let e in u){let x=u[e];if(x.location>=0){let s=d[e];if(s===void 0){if(e==="instanceMatrix"&&A.instanceMatrix)s=A.instanceMatrix;if(e==="instanceColor"&&A.instanceColor)s=A.instanceColor}if(s!==void 0){let{normalized:YJ,itemSize:HJ}=s,MJ=Z.get(s);if(MJ===void 0)continue;let{buffer:LJ,type:bJ,bytesPerElement:CJ}=MJ,oJ=Q.isWebGL2===!0&&(bJ===J.INT||bJ===J.UNSIGNED_INT||s.gpuType===1013);if(s.isInterleavedBufferAttribute){let v=s.data,w7=v.stride,dJ=s.offset;if(v.isInstancedInterleavedBuffer){for(let OJ=0;OJ<x.locationSize;OJ++)k(x.location+OJ,v.meshPerAttribute);if(A.isInstancedMesh!==!0&&a._maxInstanceCount===void 0)a._maxInstanceCount=v.meshPerAttribute*v.count}else for(let OJ=0;OJ<x.locationSize;OJ++)w(x.location+OJ);J.bindBuffer(J.ARRAY_BUFFER,LJ);for(let OJ=0;OJ<x.locationSize;OJ++)S(x.location+OJ,HJ/x.locationSize,bJ,YJ,w7*CJ,(dJ+HJ/x.locationSize*OJ)*CJ,oJ)}else{if(s.isInstancedBufferAttribute){for(let v=0;v<x.locationSize;v++)k(x.location+v,s.meshPerAttribute);if(A.isInstancedMesh!==!0&&a._maxInstanceCount===void 0)a._maxInstanceCount=s.meshPerAttribute*s.count}else for(let v=0;v<x.locationSize;v++)w(x.location+v);J.bindBuffer(J.ARRAY_BUFFER,LJ);for(let v=0;v<x.locationSize;v++)S(x.location+v,HJ/x.locationSize,bJ,YJ,HJ*CJ,HJ/x.locationSize*v*CJ,oJ)}}else if(t!==void 0){let YJ=t[e];if(YJ!==void 0)switch(YJ.length){case 2:J.vertexAttrib2fv(x.location,YJ);break;case 3:J.vertexAttrib3fv(x.location,YJ);break;case 4:J.vertexAttrib4fv(x.location,YJ);break;default:J.vertexAttrib1fv(x.location,YJ)}}}}L()}function B(){c();for(let A in Y){let l=Y[A];for(let m in l){let a=l[m];for(let d in a)_(a[d].object),delete a[d];delete l[m]}delete Y[A]}}function I(A){if(Y[A.id]===void 0)return;let l=Y[A.id];for(let m in l){let a=l[m];for(let d in a)_(a[d].object),delete a[d];delete l[m]}delete Y[A.id]}function y(A){for(let l in Y){let m=Y[l];if(m[A.id]===void 0)continue;let a=m[A.id];for(let d in a)_(a[d].object),delete a[d];delete m[A.id]}}function c(){if(ZJ(),K=!0,U===q)return;U=q,O(U.object)}function ZJ(){q.geometry=null,q.program=null,q.wireframe=!1}return{setup:E,reset:c,resetDefaultState:ZJ,dispose:B,releaseStatesOfGeometry:I,releaseStatesOfProgram:y,initAttributes:z,enableAttribute:w,disableUnusedAttributes:L}}function tY(J,$,Z,Q){let W=Q.isWebGL2,X;function H(K){X=K}function Y(K,E){J.drawArrays(X,K,E),Z.update(E,X,1)}function q(K,E,V){if(V===0)return;let O,_;if(W)O=J,_="drawArraysInstanced";else if(O=$.get("ANGLE_instanced_arrays"),_="drawArraysInstancedANGLE",O===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}O[_](X,K,E,V),Z.update(E,X,V)}function U(K,E,V){if(V===0)return;let O=$.get("WEBGL_multi_draw");if(O===null)for(let _=0;_<V;_++)this.render(K[_],E[_]);else{O.multiDrawArraysWEBGL(X,K,0,E,0,V);let _=0;for(let R=0;R<V;R++)_+=E[R];Z.update(_,X,1)}}this.setMode=H,this.render=Y,this.renderInstances=q,this.renderMultiDraw=U}function eY(J,$,Z){let Q;function W(){if(Q!==void 0)return Q;if($.has("EXT_texture_filter_anisotropic")===!0){let S=$.get("EXT_texture_filter_anisotropic");Q=J.getParameter(S.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else Q=0;return Q}function X(S){if(S==="highp"){if(J.getShaderPrecisionFormat(J.VERTEX_SHADER,J.HIGH_FLOAT).precision>0&&J.getShaderPrecisionFormat(J.FRAGMENT_SHADER,J.HIGH_FLOAT).precision>0)return"highp";S="mediump"}if(S==="mediump"){if(J.getShaderPrecisionFormat(J.VERTEX_SHADER,J.MEDIUM_FLOAT).precision>0&&J.getShaderPrecisionFormat(J.FRAGMENT_SHADER,J.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let H=typeof WebGL2RenderingContext<"u"&&J.constructor.name==="WebGL2RenderingContext",Y=Z.precision!==void 0?Z.precision:"highp",q=X(Y);if(q!==Y)console.warn("THREE.WebGLRenderer:",Y,"not supported, using",q,"instead."),Y=q;let U=H||$.has("WEBGL_draw_buffers"),K=Z.logarithmicDepthBuffer===!0,E=J.getParameter(J.MAX_TEXTURE_IMAGE_UNITS),V=J.getParameter(J.MAX_VERTEX_TEXTURE_IMAGE_UNITS),O=J.getParameter(J.MAX_TEXTURE_SIZE),_=J.getParameter(J.MAX_CUBE_MAP_TEXTURE_SIZE),R=J.getParameter(J.MAX_VERTEX_ATTRIBS),F=J.getParameter(J.MAX_VERTEX_UNIFORM_VECTORS),G=J.getParameter(J.MAX_VARYING_VECTORS),N=J.getParameter(J.MAX_FRAGMENT_UNIFORM_VECTORS),z=V>0,w=H||$.has("OES_texture_float"),k=z&&w,L=H?J.getParameter(J.MAX_SAMPLES):0;return{isWebGL2:H,drawBuffers:U,getMaxAnisotropy:W,getMaxPrecision:X,precision:Y,logarithmicDepthBuffer:K,maxTextures:E,maxVertexTextures:V,maxTextureSize:O,maxCubemapSize:_,maxAttributes:R,maxVertexUniforms:F,maxVaryings:G,maxFragmentUniforms:N,vertexTextures:z,floatFragmentTextures:w,floatVertexTextures:k,maxSamples:L}}function J4(J){let $=this,Z=null,Q=0,W=!1,X=!1,H=new F9,Y=new hJ,q={value:null,needsUpdate:!1};this.uniform=q,this.numPlanes=0,this.numIntersection=0,this.init=function(E,V){let O=E.length!==0||V||Q!==0||W;return W=V,Q=E.length,O},this.beginShadows=function(){X=!0,K(null)},this.endShadows=function(){X=!1},this.setGlobalState=function(E,V){Z=K(E,V,0)},this.setState=function(E,V,O){let{clippingPlanes:_,clipIntersection:R,clipShadows:F}=E,G=J.get(E);if(!W||_===null||_.length===0||X&&!F)if(X)K(null);else U();else{let N=X?0:Q,z=N*4,w=G.clippingState||null;q.value=w,w=K(_,V,z,O);for(let k=0;k!==z;++k)w[k]=Z[k];G.clippingState=w,this.numIntersection=R?this.numPlanes:0,this.numPlanes+=N}};function U(){if(q.value!==Z)q.value=Z,q.needsUpdate=Q>0;$.numPlanes=Q,$.numIntersection=0}function K(E,V,O,_){let R=E!==null?E.length:0,F=null;if(R!==0){if(F=q.value,_!==!0||F===null){let G=O+R*4,N=V.matrixWorldInverse;if(Y.getNormalMatrix(N),F===null||F.length<G)F=new Float32Array(G);for(let z=0,w=O;z!==R;++z,w+=4)H.copy(E[z]).applyMatrix4(N,Y),H.normal.toArray(F,w),F[w+3]=H.constant}q.value=F,q.needsUpdate=!0}return $.numPlanes=R,$.numIntersection=0,F}}function $4(J){let $=new WeakMap;function Z(H,Y){if(Y===303)H.mapping=301;else if(Y===304)H.mapping=302;return H}function Q(H){if(H&&H.isTexture){let Y=H.mapping;if(Y===303||Y===304)if($.has(H)){let q=$.get(H).texture;return Z(q,H.mapping)}else{let q=H.image;if(q&&q.height>0){let U=new Z5(q.height/2);return U.fromEquirectangularTexture(J,H),$.set(H,U),H.addEventListener("dispose",W),Z(U.texture,H.mapping)}else return null}}return H}function W(H){let Y=H.target;Y.removeEventListener("dispose",W);let q=$.get(Y);if(q!==void 0)$.delete(Y),q.dispose()}function X(){$=new WeakMap}return{get:Q,dispose:X}}class f$ extends l8{constructor(J=-1,$=1,Z=1,Q=-1,W=0.1,X=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=J,this.right=$,this.top=Z,this.bottom=Q,this.near=W,this.far=X,this.updateProjectionMatrix()}copy(J,$){return super.copy(J,$),this.left=J.left,this.right=J.right,this.top=J.top,this.bottom=J.bottom,this.near=J.near,this.far=J.far,this.zoom=J.zoom,this.view=J.view===null?null:Object.assign({},J.view),this}setViewOffset(J,$,Z,Q,W,X){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=J,this.view.fullHeight=$,this.view.offsetX=Z,this.view.offsetY=Q,this.view.width=W,this.view.height=X,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let J=(this.right-this.left)/(2*this.zoom),$=(this.top-this.bottom)/(2*this.zoom),Z=(this.right+this.left)/2,Q=(this.top+this.bottom)/2,W=Z-J,X=Z+J,H=Q+$,Y=Q-$;if(this.view!==null&&this.view.enabled){let q=(this.right-this.left)/this.view.fullWidth/this.zoom,U=(this.top-this.bottom)/this.view.fullHeight/this.zoom;W+=q*this.view.offsetX,X=W+q*this.view.width,H-=U*this.view.offsetY,Y=H-U*this.view.height}this.projectionMatrix.makeOrthographic(W,X,H,Y,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(J){let $=super.toJSON(J);if($.object.zoom=this.zoom,$.object.left=this.left,$.object.right=this.right,$.object.top=this.top,$.object.bottom=this.bottom,$.object.near=this.near,$.object.far=this.far,this.view!==null)$.object.view=Object.assign({},this.view);return $}}var Z$=4,e6=[0.125,0.215,0.35,0.446,0.526,0.582],j9=20,_8=new f$,JZ=new GJ,N8=null,z8=0,M8=0,S9=(1+Math.sqrt(5))/2,J$=1/S9,$Z=[new T(1,1,1),new T(-1,1,1),new T(1,1,-1),new T(-1,1,-1),new T(0,S9,J$),new T(0,S9,-J$),new T(J$,0,S9),new T(-J$,0,S9),new T(S9,J$,0),new T(-S9,J$,0)];class P8{constructor(J){this._renderer=J,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(J,$=0,Z=0.1,Q=100){N8=this._renderer.getRenderTarget(),z8=this._renderer.getActiveCubeFace(),M8=this._renderer.getActiveMipmapLevel(),this._setSize(256);let W=this._allocateTargets();if(W.depthBuffer=!0,this._sceneToCubeUV(J,Z,Q,W),$>0)this._blur(W,0,0,$);return this._applyPMREM(W),this._cleanup(W),W}fromEquirectangular(J,$=null){return this._fromTexture(J,$)}fromCubemap(J,$=null){return this._fromTexture(J,$)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=WZ(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=QZ(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose()}_setSize(J){this._lodMax=Math.floor(Math.log2(J)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let J=0;J<this._lodPlanes.length;J++)this._lodPlanes[J].dispose()}_cleanup(J){this._renderer.setRenderTarget(N8,z8,M8),J.scissorTest=!1,B0(J,0,0,J.width,J.height)}_fromTexture(J,$){if(J.mapping===301||J.mapping===302)this._setSize(J.image.length===0?16:J.image[0].width||J.image[0].image.width);else this._setSize(J.image.width/4);N8=this._renderer.getRenderTarget(),z8=this._renderer.getActiveCubeFace(),M8=this._renderer.getActiveMipmapLevel();let Z=$||this._allocateTargets();return this._textureToCubeUV(J,Z),this._applyPMREM(Z),this._cleanup(Z),Z}_allocateTargets(){let J=3*Math.max(this._cubeSize,112),$=4*this._cubeSize,Z={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:"srgb-linear",depthBuffer:!1},Q=ZZ(J,$,Z);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==J||this._pingPongRenderTarget.height!==$){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=ZZ(J,$,Z);let{_lodMax:W}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Z4(W)),this._blurMaterial=Q4(W,J,$)}return Q}_compileMaterial(J){let $=new H7(this._lodPlanes[0],J);this._renderer.compile($,_8)}_sceneToCubeUV(J,$,Z,Q){let H=new M7(90,1,$,Z),Y=[1,-1,1,1,1,1],q=[1,1,1,-1,-1,-1],U=this._renderer,K=U.autoClear,E=U.toneMapping;U.getClearColor(JZ),U.toneMapping=0,U.autoClear=!1;let V=new f7({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),O=new H7(new v9,V),_=!1,R=J.background;if(R){if(R.isColor)V.color.copy(R),J.background=null,_=!0}else V.color.copy(JZ),_=!0;for(let F=0;F<6;F++){let G=F%3;if(G===0)H.up.set(0,Y[F],0),H.lookAt(q[F],0,0);else if(G===1)H.up.set(0,0,Y[F]),H.lookAt(0,q[F],0);else H.up.set(0,Y[F],0),H.lookAt(0,0,q[F]);let N=this._cubeSize;if(B0(Q,G*N,F>2?N:0,N,N),U.setRenderTarget(Q),_)U.render(O,H);U.render(J,H)}O.geometry.dispose(),O.material.dispose(),U.toneMapping=E,U.autoClear=K,J.background=R}_textureToCubeUV(J,$){let Z=this._renderer,Q=J.mapping===301||J.mapping===302;if(Q){if(this._cubemapMaterial===null)this._cubemapMaterial=WZ();this._cubemapMaterial.uniforms.flipEnvMap.value=J.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=QZ();let W=Q?this._cubemapMaterial:this._equirectMaterial,X=new H7(this._lodPlanes[0],W),H=W.uniforms;H.envMap.value=J;let Y=this._cubeSize;B0($,0,0,3*Y,2*Y),Z.setRenderTarget($),Z.render(X,_8)}_applyPMREM(J){let $=this._renderer,Z=$.autoClear;$.autoClear=!1;for(let Q=1;Q<this._lodPlanes.length;Q++){let W=Math.sqrt(this._sigmas[Q]*this._sigmas[Q]-this._sigmas[Q-1]*this._sigmas[Q-1]),X=$Z[(Q-1)%$Z.length];this._blur(J,Q-1,Q,W,X)}$.autoClear=Z}_blur(J,$,Z,Q,W){let X=this._pingPongRenderTarget;this._halfBlur(J,X,$,Z,Q,"latitudinal",W),this._halfBlur(X,J,Z,Z,Q,"longitudinal",W)}_halfBlur(J,$,Z,Q,W,X,H){let Y=this._renderer,q=this._blurMaterial;if(X!=="latitudinal"&&X!=="longitudinal")console.error("blur direction must be either latitudinal or longitudinal!");let U=3,K=new H7(this._lodPlanes[Q],q),E=q.uniforms,V=this._sizeLods[Z]-1,O=isFinite(W)?Math.PI/(2*V):2*Math.PI/(2*j9-1),_=W/O,R=isFinite(W)?1+Math.floor(U*_):j9;if(R>j9)console.warn(`sigmaRadians, ${W}, is too large and will clip, as it requested ${R} samples when the maximum is set to ${j9}`);let F=[],G=0;for(let L=0;L<j9;++L){let S=L/_,g=Math.exp(-S*S/2);if(F.push(g),L===0)G+=g;else if(L<R)G+=2*g}for(let L=0;L<F.length;L++)F[L]=F[L]/G;if(E.envMap.value=J.texture,E.samples.value=R,E.weights.value=F,E.latitudinal.value=X==="latitudinal",H)E.poleAxis.value=H;let{_lodMax:N}=this;E.dTheta.value=O,E.mipInt.value=N-Z;let z=this._sizeLods[Q],w=3*z*(Q>N-Z$?Q-N+Z$:0),k=4*(this._cubeSize-z);B0($,w,k,3*z,2*z),Y.setRenderTarget($),Y.render(K,_8)}}function Z4(J){let $=[],Z=[],Q=[],W=J,X=J-Z$+1+e6.length;for(let H=0;H<X;H++){let Y=Math.pow(2,W);Z.push(Y);let q=1/Y;if(H>J-Z$)q=e6[H-J+Z$-1];else if(H===0)q=0;Q.push(q);let U=1/(Y-2),K=-U,E=1+U,V=[K,K,E,K,E,E,K,K,E,E,K,E],O=6,_=6,R=3,F=2,G=1,N=new Float32Array(R*_*O),z=new Float32Array(F*_*O),w=new Float32Array(G*_*O);for(let L=0;L<O;L++){let S=L%3*2/3-1,g=L>2?0:-1,B=[S,g,0,S+0.6666666666666666,g,0,S+0.6666666666666666,g+1,0,S,g,0,S+0.6666666666666666,g+1,0,S,g+1,0];N.set(B,R*_*L),z.set(V,F*_*L);let I=[L,L,L,L,L,L];w.set(I,G*_*L)}let k=new E7;if(k.setAttribute("position",new Z7(N,R)),k.setAttribute("uv",new Z7(z,F)),k.setAttribute("faceIndex",new Z7(w,G)),$.push(k),W>Z$)W--}return{lodPlanes:$,sizeLods:Z,sigmas:Q}}function ZZ(J,$,Z){let Q=new R9(J,$,Z);return Q.texture.mapping=306,Q.texture.name="PMREM.cubeUv",Q.scissorTest=!0,Q}function B0(J,$,Z,Q,W){J.viewport.set($,Z,Q,W),J.scissor.set($,Z,Q,W)}function Q4(J,$,Z){let Q=new Float32Array(j9),W=new T(0,1,0);return new _9({name:"SphericalGaussianBlur",defines:{n:j9,CUBEUV_TEXEL_WIDTH:1/$,CUBEUV_TEXEL_HEIGHT:1/Z,CUBEUV_MAX_MIP:`${J}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:Q},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:W}},vertexShader:m8(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function QZ(){return new _9({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:m8(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function WZ(){return new _9({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:m8(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function m8(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function W4(J){let $=new WeakMap,Z=null;function Q(Y){if(Y&&Y.isTexture){let q=Y.mapping,U=q===303||q===304,K=q===301||q===302;if(U||K)if(Y.isRenderTargetTexture&&Y.needsPMREMUpdate===!0){Y.needsPMREMUpdate=!1;let E=$.get(Y);if(Z===null)Z=new P8(J);return E=U?Z.fromEquirectangular(Y,E):Z.fromCubemap(Y,E),$.set(Y,E),E.texture}else if($.has(Y))return $.get(Y).texture;else{let E=Y.image;if(U&&E&&E.height>0||K&&E&&W(E)){if(Z===null)Z=new P8(J);let V=U?Z.fromEquirectangular(Y):Z.fromCubemap(Y);return $.set(Y,V),Y.addEventListener("dispose",X),V.texture}else return null}}return Y}function W(Y){let q=0,U=6;for(let K=0;K<U;K++)if(Y[K]!==void 0)q++;return q===U}function X(Y){let q=Y.target;q.removeEventListener("dispose",X);let U=$.get(q);if(U!==void 0)$.delete(q),U.dispose()}function H(){if($=new WeakMap,Z!==null)Z.dispose(),Z=null}return{get:Q,dispose:H}}function X4(J){let $={};function Z(Q){if($[Q]!==void 0)return $[Q];let W;switch(Q){case"WEBGL_depth_texture":W=J.getExtension("WEBGL_depth_texture")||J.getExtension("MOZ_WEBGL_depth_texture")||J.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":W=J.getExtension("EXT_texture_filter_anisotropic")||J.getExtension("MOZ_EXT_texture_filter_anisotropic")||J.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":W=J.getExtension("WEBGL_compressed_texture_s3tc")||J.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||J.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":W=J.getExtension("WEBGL_compressed_texture_pvrtc")||J.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:W=J.getExtension(Q)}return $[Q]=W,W}return{has:function(Q){return Z(Q)!==null},init:function(Q){if(Q.isWebGL2)Z("EXT_color_buffer_float"),Z("WEBGL_clip_cull_distance");else Z("WEBGL_depth_texture"),Z("OES_texture_float"),Z("OES_texture_half_float"),Z("OES_texture_half_float_linear"),Z("OES_standard_derivatives"),Z("OES_element_index_uint"),Z("OES_vertex_array_object"),Z("ANGLE_instanced_arrays");Z("OES_texture_float_linear"),Z("EXT_color_buffer_half_float"),Z("WEBGL_multisampled_render_to_texture")},get:function(Q){let W=Z(Q);if(W===null)console.warn("THREE.WebGLRenderer: "+Q+" extension not supported.");return W}}}function Y4(J,$,Z,Q){let W={},X=new WeakMap;function H(E){let V=E.target;if(V.index!==null)$.remove(V.index);for(let _ in V.attributes)$.remove(V.attributes[_]);for(let _ in V.morphAttributes){let R=V.morphAttributes[_];for(let F=0,G=R.length;F<G;F++)$.remove(R[F])}V.removeEventListener("dispose",H),delete W[V.id];let O=X.get(V);if(O)$.remove(O),X.delete(V);if(Q.releaseStatesOfGeometry(V),V.isInstancedBufferGeometry===!0)delete V._maxInstanceCount;Z.memory.geometries--}function Y(E,V){if(W[V.id]===!0)return V;return V.addEventListener("dispose",H),W[V.id]=!0,Z.memory.geometries++,V}function q(E){let V=E.attributes;for(let _ in V)$.update(V[_],J.ARRAY_BUFFER);let O=E.morphAttributes;for(let _ in O){let R=O[_];for(let F=0,G=R.length;F<G;F++)$.update(R[F],J.ARRAY_BUFFER)}}function U(E){let V=[],O=E.index,_=E.attributes.position,R=0;if(O!==null){let N=O.array;R=O.version;for(let z=0,w=N.length;z<w;z+=3){let k=N[z+0],L=N[z+1],S=N[z+2];V.push(k,L,L,S,S,k)}}else if(_!==void 0){let N=_.array;R=_.version;for(let z=0,w=N.length/3-1;z<w;z+=3){let k=z+0,L=z+1,S=z+2;V.push(k,L,L,S,S,k)}}else return;let F=new((aZ(V))?p8:g8)(V,1);F.version=R;let G=X.get(E);if(G)$.remove(G);X.set(E,F)}function K(E){let V=X.get(E);if(V){let O=E.index;if(O!==null){if(V.version<O.version)U(E)}}else U(E);return X.get(E)}return{get:Y,update:q,getWireframeAttribute:K}}function H4(J,$,Z,Q){let W=Q.isWebGL2,X;function H(O){X=O}let Y,q;function U(O){Y=O.type,q=O.bytesPerElement}function K(O,_){J.drawElements(X,_,Y,O*q),Z.update(_,X,1)}function E(O,_,R){if(R===0)return;let F,G;if(W)F=J,G="drawElementsInstanced";else if(F=$.get("ANGLE_instanced_arrays"),G="drawElementsInstancedANGLE",F===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}F[G](X,_,Y,O*q,R),Z.update(_,X,R)}function V(O,_,R){if(R===0)return;let F=$.get("WEBGL_multi_draw");if(F===null)for(let G=0;G<R;G++)this.render(O[G]/q,_[G]);else{F.multiDrawElementsWEBGL(X,_,0,Y,O,0,R);let G=0;for(let N=0;N<R;N++)G+=_[N];Z.update(G,X,1)}}this.setMode=H,this.setIndex=U,this.render=K,this.renderInstances=E,this.renderMultiDraw=V}function q4(J){let $={geometries:0,textures:0},Z={frame:0,calls:0,triangles:0,points:0,lines:0};function Q(X,H,Y){switch(Z.calls++,H){case J.TRIANGLES:Z.triangles+=Y*(X/3);break;case J.LINES:Z.lines+=Y*(X/2);break;case J.LINE_STRIP:Z.lines+=Y*(X-1);break;case J.LINE_LOOP:Z.lines+=Y*X;break;case J.POINTS:Z.points+=Y*X;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",H);break}}function W(){Z.calls=0,Z.triangles=0,Z.points=0,Z.lines=0}return{memory:$,render:Z,programs:null,autoReset:!0,reset:W,update:Q}}function U4(J,$){return J[0]-$[0]}function K4(J,$){return Math.abs($[1])-Math.abs(J[1])}function E4(J,$,Z){let Q={},W=new Float32Array(8),X=new WeakMap,H=new J7,Y=[];for(let U=0;U<8;U++)Y[U]=[U,0];function q(U,K,E){let V=U.morphTargetInfluences;if($.isWebGL2===!0){let O=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,_=O!==void 0?O.length:0,R=X.get(K);if(R===void 0||R.count!==_){let A=function(){c.dispose(),X.delete(K),K.removeEventListener("dispose",A)};if(R!==void 0)R.texture.dispose();let N=K.morphAttributes.position!==void 0,z=K.morphAttributes.normal!==void 0,w=K.morphAttributes.color!==void 0,k=K.morphAttributes.position||[],L=K.morphAttributes.normal||[],S=K.morphAttributes.color||[],g=0;if(N===!0)g=1;if(z===!0)g=2;if(w===!0)g=3;let B=K.attributes.position.count*g,I=1;if(B>$.maxTextureSize)I=Math.ceil(B/$.maxTextureSize),B=$.maxTextureSize;let y=new Float32Array(B*I*4*_),c=new h8(y,B,I,_);c.type=1015,c.needsUpdate=!0;let ZJ=g*4;for(let l=0;l<_;l++){let m=k[l],a=L[l],d=S[l],u=B*I*4*l;for(let t=0;t<m.count;t++){let e=t*ZJ;if(N===!0)H.fromBufferAttribute(m,t),y[u+e+0]=H.x,y[u+e+1]=H.y,y[u+e+2]=H.z,y[u+e+3]=0;if(z===!0)H.fromBufferAttribute(a,t),y[u+e+4]=H.x,y[u+e+5]=H.y,y[u+e+6]=H.z,y[u+e+7]=0;if(w===!0)H.fromBufferAttribute(d,t),y[u+e+8]=H.x,y[u+e+9]=H.y,y[u+e+10]=H.z,y[u+e+11]=d.itemSize===4?H.w:1}}R={count:_,texture:c,size:new yJ(B,I)},X.set(K,R),K.addEventListener("dispose",A)}let F=0;for(let N=0;N<V.length;N++)F+=V[N];let G=K.morphTargetsRelative?1:1-F;E.getUniforms().setValue(J,"morphTargetBaseInfluence",G),E.getUniforms().setValue(J,"morphTargetInfluences",V),E.getUniforms().setValue(J,"morphTargetsTexture",R.texture,Z),E.getUniforms().setValue(J,"morphTargetsTextureSize",R.size)}else{let O=V===void 0?0:V.length,_=Q[K.id];if(_===void 0||_.length!==O){_=[];for(let z=0;z<O;z++)_[z]=[z,0];Q[K.id]=_}for(let z=0;z<O;z++){let w=_[z];w[0]=z,w[1]=V[z]}_.sort(K4);for(let z=0;z<8;z++)if(z<O&&_[z][1])Y[z][0]=_[z][0],Y[z][1]=_[z][1];else Y[z][0]=Number.MAX_SAFE_INTEGER,Y[z][1]=0;Y.sort(U4);let R=K.morphAttributes.position,F=K.morphAttributes.normal,G=0;for(let z=0;z<8;z++){let w=Y[z],k=w[0],L=w[1];if(k!==Number.MAX_SAFE_INTEGER&&L){if(R&&K.getAttribute("morphTarget"+z)!==R[k])K.setAttribute("morphTarget"+z,R[k]);if(F&&K.getAttribute("morphNormal"+z)!==F[k])K.setAttribute("morphNormal"+z,F[k]);W[z]=L,G+=L}else{if(R&&K.hasAttribute("morphTarget"+z)===!0)K.deleteAttribute("morphTarget"+z);if(F&&K.hasAttribute("morphNormal"+z)===!0)K.deleteAttribute("morphNormal"+z);W[z]=0}}let N=K.morphTargetsRelative?1:1-G;E.getUniforms().setValue(J,"morphTargetBaseInfluence",N),E.getUniforms().setValue(J,"morphTargetInfluences",W)}}return{update:q}}function V4(J,$,Z,Q){let W=new WeakMap;function X(q){let U=Q.render.frame,K=q.geometry,E=$.get(q,K);if(W.get(E)!==U)$.update(E),W.set(E,U);if(q.isInstancedMesh){if(q.hasEventListener("dispose",Y)===!1)q.addEventListener("dispose",Y);if(W.get(q)!==U){if(Z.update(q.instanceMatrix,J.ARRAY_BUFFER),q.instanceColor!==null)Z.update(q.instanceColor,J.ARRAY_BUFFER);W.set(q,U)}}if(q.isSkinnedMesh){let V=q.skeleton;if(W.get(V)!==U)V.update(),W.set(V,U)}return E}function H(){W=new WeakMap}function Y(q){let U=q.target;if(U.removeEventListener("dispose",Y),Z.remove(U.instanceMatrix),U.instanceColor!==null)Z.remove(U.instanceColor)}return{update:X,dispose:H}}class d8 extends O7{constructor(J,$,Z,Q,W,X,H,Y,q,U){if(U=U!==void 0?U:1026,U!==1026&&U!==1027)throw Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");if(Z===void 0&&U===1026)Z=1014;if(Z===void 0&&U===1027)Z=1020;super(null,Q,W,X,H,Y,U,Z,q);this.isDepthTexture=!0,this.image={width:J,height:$},this.magFilter=H!==void 0?H:1003,this.minFilter=Y!==void 0?Y:1003,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(J){return super.copy(J),this.compareFunction=J.compareFunction,this}toJSON(J){let $=super.toJSON(J);if(this.compareFunction!==null)$.compareFunction=this.compareFunction;return $}}var W5=new O7,X5=new d8(1,1);X5.compareFunction=515;var Y5=new h8,H5=new tZ,q5=new u8,XZ=[],YZ=[],HZ=new Float32Array(16),qZ=new Float32Array(9),UZ=new Float32Array(4);function K$(J,$,Z){let Q=J[0];if(Q<=0||Q>0)return J;let W=$*Z,X=XZ[W];if(X===void 0)X=new Float32Array(W),XZ[W]=X;if($!==0){Q.toArray(X,0);for(let H=1,Y=0;H!==$;++H)Y+=Z,J[H].toArray(X,Y)}return X}function R7(J,$){if(J.length!==$.length)return!1;for(let Z=0,Q=J.length;Z<Q;Z++)if(J[Z]!==$[Z])return!1;return!0}function _7(J,$){for(let Z=0,Q=$.length;Z<Q;Z++)J[Z]=$[Z]}function v0(J,$){let Z=YZ[$];if(Z===void 0)Z=new Int32Array($),YZ[$]=Z;for(let Q=0;Q!==$;++Q)Z[Q]=J.allocateTextureUnit();return Z}function G4(J,$){let Z=this.cache;if(Z[0]===$)return;J.uniform1f(this.addr,$),Z[0]=$}function F4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y)J.uniform2f(this.addr,$.x,$.y),Z[0]=$.x,Z[1]=$.y}else{if(R7(Z,$))return;J.uniform2fv(this.addr,$),_7(Z,$)}}function O4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y||Z[2]!==$.z)J.uniform3f(this.addr,$.x,$.y,$.z),Z[0]=$.x,Z[1]=$.y,Z[2]=$.z}else if($.r!==void 0){if(Z[0]!==$.r||Z[1]!==$.g||Z[2]!==$.b)J.uniform3f(this.addr,$.r,$.g,$.b),Z[0]=$.r,Z[1]=$.g,Z[2]=$.b}else{if(R7(Z,$))return;J.uniform3fv(this.addr,$),_7(Z,$)}}function R4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y||Z[2]!==$.z||Z[3]!==$.w)J.uniform4f(this.addr,$.x,$.y,$.z,$.w),Z[0]=$.x,Z[1]=$.y,Z[2]=$.z,Z[3]=$.w}else{if(R7(Z,$))return;J.uniform4fv(this.addr,$),_7(Z,$)}}function _4(J,$){let Z=this.cache,Q=$.elements;if(Q===void 0){if(R7(Z,$))return;J.uniformMatrix2fv(this.addr,!1,$),_7(Z,$)}else{if(R7(Z,Q))return;UZ.set(Q),J.uniformMatrix2fv(this.addr,!1,UZ),_7(Z,Q)}}function N4(J,$){let Z=this.cache,Q=$.elements;if(Q===void 0){if(R7(Z,$))return;J.uniformMatrix3fv(this.addr,!1,$),_7(Z,$)}else{if(R7(Z,Q))return;qZ.set(Q),J.uniformMatrix3fv(this.addr,!1,qZ),_7(Z,Q)}}function z4(J,$){let Z=this.cache,Q=$.elements;if(Q===void 0){if(R7(Z,$))return;J.uniformMatrix4fv(this.addr,!1,$),_7(Z,$)}else{if(R7(Z,Q))return;HZ.set(Q),J.uniformMatrix4fv(this.addr,!1,HZ),_7(Z,Q)}}function M4(J,$){let Z=this.cache;if(Z[0]===$)return;J.uniform1i(this.addr,$),Z[0]=$}function B4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y)J.uniform2i(this.addr,$.x,$.y),Z[0]=$.x,Z[1]=$.y}else{if(R7(Z,$))return;J.uniform2iv(this.addr,$),_7(Z,$)}}function D4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y||Z[2]!==$.z)J.uniform3i(this.addr,$.x,$.y,$.z),Z[0]=$.x,Z[1]=$.y,Z[2]=$.z}else{if(R7(Z,$))return;J.uniform3iv(this.addr,$),_7(Z,$)}}function L4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y||Z[2]!==$.z||Z[3]!==$.w)J.uniform4i(this.addr,$.x,$.y,$.z,$.w),Z[0]=$.x,Z[1]=$.y,Z[2]=$.z,Z[3]=$.w}else{if(R7(Z,$))return;J.uniform4iv(this.addr,$),_7(Z,$)}}function C4(J,$){let Z=this.cache;if(Z[0]===$)return;J.uniform1ui(this.addr,$),Z[0]=$}function w4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y)J.uniform2ui(this.addr,$.x,$.y),Z[0]=$.x,Z[1]=$.y}else{if(R7(Z,$))return;J.uniform2uiv(this.addr,$),_7(Z,$)}}function I4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y||Z[2]!==$.z)J.uniform3ui(this.addr,$.x,$.y,$.z),Z[0]=$.x,Z[1]=$.y,Z[2]=$.z}else{if(R7(Z,$))return;J.uniform3uiv(this.addr,$),_7(Z,$)}}function k4(J,$){let Z=this.cache;if($.x!==void 0){if(Z[0]!==$.x||Z[1]!==$.y||Z[2]!==$.z||Z[3]!==$.w)J.uniform4ui(this.addr,$.x,$.y,$.z,$.w),Z[0]=$.x,Z[1]=$.y,Z[2]=$.z,Z[3]=$.w}else{if(R7(Z,$))return;J.uniform4uiv(this.addr,$),_7(Z,$)}}function P4(J,$,Z){let Q=this.cache,W=Z.allocateTextureUnit();if(Q[0]!==W)J.uniform1i(this.addr,W),Q[0]=W;let X=this.type===J.SAMPLER_2D_SHADOW?X5:W5;Z.setTexture2D($||X,W)}function A4(J,$,Z){let Q=this.cache,W=Z.allocateTextureUnit();if(Q[0]!==W)J.uniform1i(this.addr,W),Q[0]=W;Z.setTexture3D($||H5,W)}function T4(J,$,Z){let Q=this.cache,W=Z.allocateTextureUnit();if(Q[0]!==W)J.uniform1i(this.addr,W),Q[0]=W;Z.setTextureCube($||q5,W)}function S4(J,$,Z){let Q=this.cache,W=Z.allocateTextureUnit();if(Q[0]!==W)J.uniform1i(this.addr,W),Q[0]=W;Z.setTexture2DArray($||Y5,W)}function j4(J){switch(J){case 5126:return G4;case 35664:return F4;case 35665:return O4;case 35666:return R4;case 35674:return _4;case 35675:return N4;case 35676:return z4;case 5124:case 35670:return M4;case 35667:case 35671:return B4;case 35668:case 35672:return D4;case 35669:case 35673:return L4;case 5125:return C4;case 36294:return w4;case 36295:return I4;case 36296:return k4;case 35678:case 36198:case 36298:case 36306:case 35682:return P4;case 35679:case 36299:case 36307:return A4;case 35680:case 36300:case 36308:case 36293:return T4;case 36289:case 36303:case 36311:case 36292:return S4}}function v4(J,$){J.uniform1fv(this.addr,$)}function y4(J,$){let Z=K$($,this.size,2);J.uniform2fv(this.addr,Z)}function x4(J,$){let Z=K$($,this.size,3);J.uniform3fv(this.addr,Z)}function f4(J,$){let Z=K$($,this.size,4);J.uniform4fv(this.addr,Z)}function h4(J,$){let Z=K$($,this.size,4);J.uniformMatrix2fv(this.addr,!1,Z)}function b4(J,$){let Z=K$($,this.size,9);J.uniformMatrix3fv(this.addr,!1,Z)}function g4(J,$){let Z=K$($,this.size,16);J.uniformMatrix4fv(this.addr,!1,Z)}function p4(J,$){J.uniform1iv(this.addr,$)}function l4(J,$){J.uniform2iv(this.addr,$)}function u4(J,$){J.uniform3iv(this.addr,$)}function m4(J,$){J.uniform4iv(this.addr,$)}function d4(J,$){J.uniform1uiv(this.addr,$)}function c4(J,$){J.uniform2uiv(this.addr,$)}function n4(J,$){J.uniform3uiv(this.addr,$)}function s4(J,$){J.uniform4uiv(this.addr,$)}function i4(J,$,Z){let Q=this.cache,W=$.length,X=v0(Z,W);if(!R7(Q,X))J.uniform1iv(this.addr,X),_7(Q,X);for(let H=0;H!==W;++H)Z.setTexture2D($[H]||W5,X[H])}function o4(J,$,Z){let Q=this.cache,W=$.length,X=v0(Z,W);if(!R7(Q,X))J.uniform1iv(this.addr,X),_7(Q,X);for(let H=0;H!==W;++H)Z.setTexture3D($[H]||H5,X[H])}function a4(J,$,Z){let Q=this.cache,W=$.length,X=v0(Z,W);if(!R7(Q,X))J.uniform1iv(this.addr,X),_7(Q,X);for(let H=0;H!==W;++H)Z.setTextureCube($[H]||q5,X[H])}function r4(J,$,Z){let Q=this.cache,W=$.length,X=v0(Z,W);if(!R7(Q,X))J.uniform1iv(this.addr,X),_7(Q,X);for(let H=0;H!==W;++H)Z.setTexture2DArray($[H]||Y5,X[H])}function t4(J){switch(J){case 5126:return v4;case 35664:return y4;case 35665:return x4;case 35666:return f4;case 35674:return h4;case 35675:return b4;case 35676:return g4;case 5124:case 35670:return p4;case 35667:case 35671:return l4;case 35668:case 35672:return u4;case 35669:case 35673:return m4;case 5125:return d4;case 36294:return c4;case 36295:return n4;case 36296:return s4;case 35678:case 36198:case 36298:case 36306:case 35682:return i4;case 35679:case 36299:case 36307:return o4;case 35680:case 36300:case 36308:case 36293:return a4;case 36289:case 36303:case 36311:case 36292:return r4}}class U5{constructor(J,$,Z){this.id=J,this.addr=Z,this.cache=[],this.type=$.type,this.setValue=j4($.type)}}class K5{constructor(J,$,Z){this.id=J,this.addr=Z,this.cache=[],this.type=$.type,this.size=$.size,this.setValue=t4($.type)}}class E5{constructor(J){this.id=J,this.seq=[],this.map={}}setValue(J,$,Z){let Q=this.seq;for(let W=0,X=Q.length;W!==X;++W){let H=Q[W];H.setValue(J,$[H.id],Z)}}}var B8=/(\w+)(\])?(\[|\.)?/g;function KZ(J,$){J.seq.push($),J.map[$.id]=$}function e4(J,$,Z){let Q=J.name,W=Q.length;B8.lastIndex=0;while(!0){let X=B8.exec(Q),H=B8.lastIndex,Y=X[1],q=X[2]==="]",U=X[3];if(q)Y=Y|0;if(U===void 0||U==="["&&H+2===W){KZ(Z,U===void 0?new U5(Y,J,$):new K5(Y,J,$));break}else{let E=Z.map[Y];if(E===void 0)E=new E5(Y),KZ(Z,E);Z=E}}}class A${constructor(J,$){this.seq=[],this.map={};let Z=J.getProgramParameter($,J.ACTIVE_UNIFORMS);for(let Q=0;Q<Z;++Q){let W=J.getActiveUniform($,Q),X=J.getUniformLocation($,W.name);e4(W,X,this)}}setValue(J,$,Z,Q){let W=this.map[$];if(W!==void 0)W.setValue(J,Z,Q)}setOptional(J,$,Z){let Q=$[Z];if(Q!==void 0)this.setValue(J,Z,Q)}static upload(J,$,Z,Q){for(let W=0,X=$.length;W!==X;++W){let H=$[W],Y=Z[H.id];if(Y.needsUpdate!==!1)H.setValue(J,Y.value,Q)}}static seqWithValue(J,$){let Z=[];for(let Q=0,W=J.length;Q!==W;++Q){let X=J[Q];if(X.id in $)Z.push(X)}return Z}}function EZ(J,$,Z){let Q=J.createShader($);return J.shaderSource(Q,Z),J.compileShader(Q),Q}var JH=37297,$H=0;function ZH(J,$){let Z=J.split(`
`),Q=[],W=Math.max($-6,0),X=Math.min($+6,Z.length);for(let H=W;H<X;H++){let Y=H+1;Q.push(`${Y===$?">":" "} ${Y}: ${Z[H]}`)}return Q.join(`
`)}function QH(J){let $=iJ.getPrimaries(iJ.workingColorSpace),Z=iJ.getPrimaries(J),Q;if($===Z)Q="";else if($==="p3"&&Z==="rec709")Q="LinearDisplayP3ToLinearSRGB";else if($==="rec709"&&Z==="p3")Q="LinearSRGBToLinearDisplayP3";switch(J){case"srgb-linear":case"display-p3-linear":return[Q,"LinearTransferOETF"];case"srgb":case"display-p3":return[Q,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",J),[Q,"LinearTransferOETF"]}}function VZ(J,$,Z){let Q=J.getShaderParameter($,J.COMPILE_STATUS),W=J.getShaderInfoLog($).trim();if(Q&&W==="")return"";let X=/ERROR: 0:(\d+)/.exec(W);if(X){let H=parseInt(X[1]);return Z.toUpperCase()+`

`+W+`

`+ZH(J.getShaderSource($),H)}else return W}function WH(J,$){let Z=QH($);return`vec4 ${J}( vec4 value ) { return ${Z[0]}( ${Z[1]}( value ) ); }`}function XH(J,$){let Z;switch($){case 1:Z="Linear";break;case 2:Z="Reinhard";break;case 3:Z="OptimizedCineon";break;case 4:Z="ACESFilmic";break;case 6:Z="AgX";break;case 5:Z="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",$),Z="Linear"}return"vec3 "+J+"( vec3 color ) { return "+Z+"ToneMapping( color ); }"}function YH(J){return[J.extensionDerivatives||!!J.envMapCubeUVHeight||J.bumpMap||J.normalMapTangentSpace||J.clearcoatNormalMap||J.flatShading||J.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(J.extensionFragDepth||J.logarithmicDepthBuffer)&&J.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",J.extensionDrawBuffers&&J.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(J.extensionShaderTextureLOD||J.envMap||J.transmission)&&J.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Q$).join(`
`)}function HH(J){return[J.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Q$).join(`
`)}function qH(J){let $=[];for(let Z in J){let Q=J[Z];if(Q===!1)continue;$.push("#define "+Z+" "+Q)}return $.join(`
`)}function UH(J,$){let Z={},Q=J.getProgramParameter($,J.ACTIVE_ATTRIBUTES);for(let W=0;W<Q;W++){let X=J.getActiveAttrib($,W),H=X.name,Y=1;if(X.type===J.FLOAT_MAT2)Y=2;if(X.type===J.FLOAT_MAT3)Y=3;if(X.type===J.FLOAT_MAT4)Y=4;Z[H]={type:X.type,location:J.getAttribLocation($,H),locationSize:Y}}return Z}function Q$(J){return J!==""}function GZ(J,$){let Z=$.numSpotLightShadows+$.numSpotLightMaps-$.numSpotLightShadowsWithMaps;return J.replace(/NUM_DIR_LIGHTS/g,$.numDirLights).replace(/NUM_SPOT_LIGHTS/g,$.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,$.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,Z).replace(/NUM_RECT_AREA_LIGHTS/g,$.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,$.numPointLights).replace(/NUM_HEMI_LIGHTS/g,$.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,$.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,$.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,$.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,$.numPointLightShadows)}function FZ(J,$){return J.replace(/NUM_CLIPPING_PLANES/g,$.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,$.numClippingPlanes-$.numClipIntersection)}var KH=/^[ \t]*#include +<([\w\d./]+)>/gm;function A8(J){return J.replace(KH,VH)}var EH=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function VH(J,$){let Z=jJ[$];if(Z===void 0){let Q=EH.get($);if(Q!==void 0)Z=jJ[Q],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',$,Q);else throw Error("Can not resolve #include <"+$+">")}return A8(Z)}var GH=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function OZ(J){return J.replace(GH,FH)}function FH(J,$,Z,Q){let W="";for(let X=parseInt($);X<parseInt(Z);X++)W+=Q.replace(/\[\s*i\s*\]/g,"[ "+X+" ]").replace(/UNROLLED_LOOP_INDEX/g,X);return W}function RZ(J){let $="precision "+J.precision+` float;
precision `+J.precision+" int;";if(J.precision==="highp")$+=`
#define HIGH_PRECISION`;else if(J.precision==="mediump")$+=`
#define MEDIUM_PRECISION`;else if(J.precision==="lowp")$+=`
#define LOW_PRECISION`;return $}function OH(J){let $="SHADOWMAP_TYPE_BASIC";if(J.shadowMapType===1)$="SHADOWMAP_TYPE_PCF";else if(J.shadowMapType===2)$="SHADOWMAP_TYPE_PCF_SOFT";else if(J.shadowMapType===3)$="SHADOWMAP_TYPE_VSM";return $}function RH(J){let $="ENVMAP_TYPE_CUBE";if(J.envMap)switch(J.envMapMode){case 301:case 302:$="ENVMAP_TYPE_CUBE";break;case 306:$="ENVMAP_TYPE_CUBE_UV";break}return $}function _H(J){let $="ENVMAP_MODE_REFLECTION";if(J.envMap)switch(J.envMapMode){case 302:$="ENVMAP_MODE_REFRACTION";break}return $}function NH(J){let $="ENVMAP_BLENDING_NONE";if(J.envMap)switch(J.combine){case 0:$="ENVMAP_BLENDING_MULTIPLY";break;case 1:$="ENVMAP_BLENDING_MIX";break;case 2:$="ENVMAP_BLENDING_ADD";break}return $}function zH(J){let $=J.envMapCubeUVHeight;if($===null)return null;let Z=Math.log2($)-2,Q=1/$;return{texelWidth:1/(3*Math.max(Math.pow(2,Z),112)),texelHeight:Q,maxMip:Z}}function MH(J,$,Z,Q){let W=J.getContext(),X=Z.defines,H=Z.vertexShader,Y=Z.fragmentShader,q=OH(Z),U=RH(Z),K=_H(Z),E=NH(Z),V=zH(Z),O=Z.isWebGL2?"":YH(Z),_=HH(Z),R=qH(X),F=W.createProgram(),G,N,z=Z.glslVersion?"#version "+Z.glslVersion+`
`:"";if(Z.isRawShaderMaterial){if(G=["#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R].filter(Q$).join(`
`),G.length>0)G+=`
`;if(N=[O,"#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R].filter(Q$).join(`
`),N.length>0)N+=`
`}else G=[RZ(Z),"#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R,Z.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",Z.batching?"#define USE_BATCHING":"",Z.instancing?"#define USE_INSTANCING":"",Z.instancingColor?"#define USE_INSTANCING_COLOR":"",Z.useFog&&Z.fog?"#define USE_FOG":"",Z.useFog&&Z.fogExp2?"#define FOG_EXP2":"",Z.map?"#define USE_MAP":"",Z.envMap?"#define USE_ENVMAP":"",Z.envMap?"#define "+K:"",Z.lightMap?"#define USE_LIGHTMAP":"",Z.aoMap?"#define USE_AOMAP":"",Z.bumpMap?"#define USE_BUMPMAP":"",Z.normalMap?"#define USE_NORMALMAP":"",Z.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",Z.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",Z.displacementMap?"#define USE_DISPLACEMENTMAP":"",Z.emissiveMap?"#define USE_EMISSIVEMAP":"",Z.anisotropy?"#define USE_ANISOTROPY":"",Z.anisotropyMap?"#define USE_ANISOTROPYMAP":"",Z.clearcoatMap?"#define USE_CLEARCOATMAP":"",Z.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",Z.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",Z.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",Z.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",Z.specularMap?"#define USE_SPECULARMAP":"",Z.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",Z.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",Z.roughnessMap?"#define USE_ROUGHNESSMAP":"",Z.metalnessMap?"#define USE_METALNESSMAP":"",Z.alphaMap?"#define USE_ALPHAMAP":"",Z.alphaHash?"#define USE_ALPHAHASH":"",Z.transmission?"#define USE_TRANSMISSION":"",Z.transmissionMap?"#define USE_TRANSMISSIONMAP":"",Z.thicknessMap?"#define USE_THICKNESSMAP":"",Z.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",Z.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",Z.mapUv?"#define MAP_UV "+Z.mapUv:"",Z.alphaMapUv?"#define ALPHAMAP_UV "+Z.alphaMapUv:"",Z.lightMapUv?"#define LIGHTMAP_UV "+Z.lightMapUv:"",Z.aoMapUv?"#define AOMAP_UV "+Z.aoMapUv:"",Z.emissiveMapUv?"#define EMISSIVEMAP_UV "+Z.emissiveMapUv:"",Z.bumpMapUv?"#define BUMPMAP_UV "+Z.bumpMapUv:"",Z.normalMapUv?"#define NORMALMAP_UV "+Z.normalMapUv:"",Z.displacementMapUv?"#define DISPLACEMENTMAP_UV "+Z.displacementMapUv:"",Z.metalnessMapUv?"#define METALNESSMAP_UV "+Z.metalnessMapUv:"",Z.roughnessMapUv?"#define ROUGHNESSMAP_UV "+Z.roughnessMapUv:"",Z.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+Z.anisotropyMapUv:"",Z.clearcoatMapUv?"#define CLEARCOATMAP_UV "+Z.clearcoatMapUv:"",Z.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+Z.clearcoatNormalMapUv:"",Z.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+Z.clearcoatRoughnessMapUv:"",Z.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+Z.iridescenceMapUv:"",Z.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+Z.iridescenceThicknessMapUv:"",Z.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+Z.sheenColorMapUv:"",Z.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+Z.sheenRoughnessMapUv:"",Z.specularMapUv?"#define SPECULARMAP_UV "+Z.specularMapUv:"",Z.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+Z.specularColorMapUv:"",Z.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+Z.specularIntensityMapUv:"",Z.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+Z.transmissionMapUv:"",Z.thicknessMapUv?"#define THICKNESSMAP_UV "+Z.thicknessMapUv:"",Z.vertexTangents&&Z.flatShading===!1?"#define USE_TANGENT":"",Z.vertexColors?"#define USE_COLOR":"",Z.vertexAlphas?"#define USE_COLOR_ALPHA":"",Z.vertexUv1s?"#define USE_UV1":"",Z.vertexUv2s?"#define USE_UV2":"",Z.vertexUv3s?"#define USE_UV3":"",Z.pointsUvs?"#define USE_POINTS_UV":"",Z.flatShading?"#define FLAT_SHADED":"",Z.skinning?"#define USE_SKINNING":"",Z.morphTargets?"#define USE_MORPHTARGETS":"",Z.morphNormals&&Z.flatShading===!1?"#define USE_MORPHNORMALS":"",Z.morphColors&&Z.isWebGL2?"#define USE_MORPHCOLORS":"",Z.morphTargetsCount>0&&Z.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",Z.morphTargetsCount>0&&Z.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+Z.morphTextureStride:"",Z.morphTargetsCount>0&&Z.isWebGL2?"#define MORPHTARGETS_COUNT "+Z.morphTargetsCount:"",Z.doubleSided?"#define DOUBLE_SIDED":"",Z.flipSided?"#define FLIP_SIDED":"",Z.shadowMapEnabled?"#define USE_SHADOWMAP":"",Z.shadowMapEnabled?"#define "+q:"",Z.sizeAttenuation?"#define USE_SIZEATTENUATION":"",Z.numLightProbes>0?"#define USE_LIGHT_PROBES":"",Z.useLegacyLights?"#define LEGACY_LIGHTS":"",Z.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",Z.logarithmicDepthBuffer&&Z.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","\tattribute vec3 morphTarget0;","\tattribute vec3 morphTarget1;","\tattribute vec3 morphTarget2;","\tattribute vec3 morphTarget3;","\t#ifdef USE_MORPHNORMALS","\t\tattribute vec3 morphNormal0;","\t\tattribute vec3 morphNormal1;","\t\tattribute vec3 morphNormal2;","\t\tattribute vec3 morphNormal3;","\t#else","\t\tattribute vec3 morphTarget4;","\t\tattribute vec3 morphTarget5;","\t\tattribute vec3 morphTarget6;","\t\tattribute vec3 morphTarget7;","\t#endif","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(Q$).join(`
`),N=[O,RZ(Z),"#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R,Z.useFog&&Z.fog?"#define USE_FOG":"",Z.useFog&&Z.fogExp2?"#define FOG_EXP2":"",Z.map?"#define USE_MAP":"",Z.matcap?"#define USE_MATCAP":"",Z.envMap?"#define USE_ENVMAP":"",Z.envMap?"#define "+U:"",Z.envMap?"#define "+K:"",Z.envMap?"#define "+E:"",V?"#define CUBEUV_TEXEL_WIDTH "+V.texelWidth:"",V?"#define CUBEUV_TEXEL_HEIGHT "+V.texelHeight:"",V?"#define CUBEUV_MAX_MIP "+V.maxMip+".0":"",Z.lightMap?"#define USE_LIGHTMAP":"",Z.aoMap?"#define USE_AOMAP":"",Z.bumpMap?"#define USE_BUMPMAP":"",Z.normalMap?"#define USE_NORMALMAP":"",Z.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",Z.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",Z.emissiveMap?"#define USE_EMISSIVEMAP":"",Z.anisotropy?"#define USE_ANISOTROPY":"",Z.anisotropyMap?"#define USE_ANISOTROPYMAP":"",Z.clearcoat?"#define USE_CLEARCOAT":"",Z.clearcoatMap?"#define USE_CLEARCOATMAP":"",Z.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",Z.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",Z.iridescence?"#define USE_IRIDESCENCE":"",Z.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",Z.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",Z.specularMap?"#define USE_SPECULARMAP":"",Z.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",Z.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",Z.roughnessMap?"#define USE_ROUGHNESSMAP":"",Z.metalnessMap?"#define USE_METALNESSMAP":"",Z.alphaMap?"#define USE_ALPHAMAP":"",Z.alphaTest?"#define USE_ALPHATEST":"",Z.alphaHash?"#define USE_ALPHAHASH":"",Z.sheen?"#define USE_SHEEN":"",Z.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",Z.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",Z.transmission?"#define USE_TRANSMISSION":"",Z.transmissionMap?"#define USE_TRANSMISSIONMAP":"",Z.thicknessMap?"#define USE_THICKNESSMAP":"",Z.vertexTangents&&Z.flatShading===!1?"#define USE_TANGENT":"",Z.vertexColors||Z.instancingColor?"#define USE_COLOR":"",Z.vertexAlphas?"#define USE_COLOR_ALPHA":"",Z.vertexUv1s?"#define USE_UV1":"",Z.vertexUv2s?"#define USE_UV2":"",Z.vertexUv3s?"#define USE_UV3":"",Z.pointsUvs?"#define USE_POINTS_UV":"",Z.gradientMap?"#define USE_GRADIENTMAP":"",Z.flatShading?"#define FLAT_SHADED":"",Z.doubleSided?"#define DOUBLE_SIDED":"",Z.flipSided?"#define FLIP_SIDED":"",Z.shadowMapEnabled?"#define USE_SHADOWMAP":"",Z.shadowMapEnabled?"#define "+q:"",Z.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",Z.numLightProbes>0?"#define USE_LIGHT_PROBES":"",Z.useLegacyLights?"#define LEGACY_LIGHTS":"",Z.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",Z.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",Z.logarithmicDepthBuffer&&Z.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",Z.toneMapping!==0?"#define TONE_MAPPING":"",Z.toneMapping!==0?jJ.tonemapping_pars_fragment:"",Z.toneMapping!==0?XH("toneMapping",Z.toneMapping):"",Z.dithering?"#define DITHERING":"",Z.opaque?"#define OPAQUE":"",jJ.colorspace_pars_fragment,WH("linearToOutputTexel",Z.outputColorSpace),Z.useDepthPacking?"#define DEPTH_PACKING "+Z.depthPacking:"",`
`].filter(Q$).join(`
`);if(H=A8(H),H=GZ(H,Z),H=FZ(H,Z),Y=A8(Y),Y=GZ(Y,Z),Y=FZ(Y,Z),H=OZ(H),Y=OZ(Y),Z.isWebGL2&&Z.isRawShaderMaterial!==!0)z=`#version 300 es
`,G=[_,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+G,N=["precision mediump sampler2DArray;","#define varying in",Z.glslVersion==="300 es"?"":"layout(location = 0) out highp vec4 pc_fragColor;",Z.glslVersion==="300 es"?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+N;let w=z+G+H,k=z+N+Y,L=EZ(W,W.VERTEX_SHADER,w),S=EZ(W,W.FRAGMENT_SHADER,k);if(W.attachShader(F,L),W.attachShader(F,S),Z.index0AttributeName!==void 0)W.bindAttribLocation(F,0,Z.index0AttributeName);else if(Z.morphTargets===!0)W.bindAttribLocation(F,0,"position");W.linkProgram(F);function g(c){if(J.debug.checkShaderErrors){let ZJ=W.getProgramInfoLog(F).trim(),A=W.getShaderInfoLog(L).trim(),l=W.getShaderInfoLog(S).trim(),m=!0,a=!0;if(W.getProgramParameter(F,W.LINK_STATUS)===!1)if(m=!1,typeof J.debug.onShaderError==="function")J.debug.onShaderError(W,F,L,S);else{let d=VZ(W,L,"vertex"),u=VZ(W,S,"fragment");console.error("THREE.WebGLProgram: Shader Error "+W.getError()+" - VALIDATE_STATUS "+W.getProgramParameter(F,W.VALIDATE_STATUS)+`

Program Info Log: `+ZJ+`
`+d+`
`+u)}else if(ZJ!=="")console.warn("THREE.WebGLProgram: Program Info Log:",ZJ);else if(A===""||l==="")a=!1;if(a)c.diagnostics={runnable:m,programLog:ZJ,vertexShader:{log:A,prefix:G},fragmentShader:{log:l,prefix:N}}}W.deleteShader(L),W.deleteShader(S),B=new A$(W,F),I=UH(W,F)}let B;this.getUniforms=function(){if(B===void 0)g(this);return B};let I;this.getAttributes=function(){if(I===void 0)g(this);return I};let y=Z.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(y===!1)y=W.getProgramParameter(F,JH);return y},this.destroy=function(){Q.releaseStatesOfProgram(this),W.deleteProgram(F),this.program=void 0},this.type=Z.shaderType,this.name=Z.shaderName,this.id=$H++,this.cacheKey=$,this.usedTimes=1,this.program=F,this.vertexShader=L,this.fragmentShader=S,this}var BH=0;class V5{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(J){let{vertexShader:$,fragmentShader:Z}=J,Q=this._getShaderStage($),W=this._getShaderStage(Z),X=this._getShaderCacheForMaterial(J);if(X.has(Q)===!1)X.add(Q),Q.usedTimes++;if(X.has(W)===!1)X.add(W),W.usedTimes++;return this}remove(J){let $=this.materialCache.get(J);for(let Z of $)if(Z.usedTimes--,Z.usedTimes===0)this.shaderCache.delete(Z.code);return this.materialCache.delete(J),this}getVertexShaderID(J){return this._getShaderStage(J.vertexShader).id}getFragmentShaderID(J){return this._getShaderStage(J.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(J){let $=this.materialCache,Z=$.get(J);if(Z===void 0)Z=new Set,$.set(J,Z);return Z}_getShaderStage(J){let $=this.shaderCache,Z=$.get(J);if(Z===void 0)Z=new G5(J),$.set(J,Z);return Z}}class G5{constructor(J){this.id=BH++,this.code=J,this.usedTimes=0}}function DH(J,$,Z,Q,W,X,H){let Y=new b8,q=new V5,U=[],K=W.isWebGL2,E=W.logarithmicDepthBuffer,V=W.vertexTextures,O=W.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function R(B){if(B===0)return"uv";return`uv${B}`}function F(B,I,y,c,ZJ){let A=c.fog,l=ZJ.geometry,m=B.isMeshStandardMaterial?c.environment:null,a=(B.isMeshStandardMaterial?Z:$).get(B.envMap||m),d=!!a&&a.mapping===306?a.image.height:null,u=_[B.type];if(B.precision!==null){if(O=W.getMaxPrecision(B.precision),O!==B.precision)console.warn("THREE.WebGLProgram.getParameters:",B.precision,"not supported, using",O,"instead.")}let t=l.morphAttributes.position||l.morphAttributes.normal||l.morphAttributes.color,e=t!==void 0?t.length:0,x=0;if(l.morphAttributes.position!==void 0)x=1;if(l.morphAttributes.normal!==void 0)x=2;if(l.morphAttributes.color!==void 0)x=3;let s,YJ,HJ,MJ;if(u){let I7=r7[u];s=I7.vertexShader,YJ=I7.fragmentShader}else s=B.vertexShader,YJ=B.fragmentShader,q.update(B),HJ=q.getVertexShaderID(B),MJ=q.getFragmentShaderID(B);let LJ=J.getRenderTarget(),bJ=ZJ.isInstancedMesh===!0,CJ=ZJ.isBatchedMesh===!0,oJ=!!B.map,v=!!B.matcap,w7=!!a,dJ=!!B.aoMap,OJ=!!B.lightMap,zJ=!!B.bumpMap,TJ=!!B.normalMap,uJ=!!B.displacementMap,xJ=!!B.emissiveMap,C=!!B.metalnessMap,M=!!B.roughnessMap,h=B.anisotropy>0,r=B.clearcoat>0,n=B.iridescence>0,o=B.sheen>0,_J=B.transmission>0,WJ=h&&!!B.anisotropyMap,UJ=r&&!!B.clearcoatMap,FJ=r&&!!B.clearcoatNormalMap,SJ=r&&!!B.clearcoatRoughnessMap,i=n&&!!B.iridescenceMap,U7=n&&!!B.iridescenceThicknessMap,gJ=o&&!!B.sheenColorMap,IJ=o&&!!B.sheenRoughnessMap,KJ=!!B.specularMap,EJ=!!B.specularColorMap,pJ=!!B.specularIntensityMap,rJ=_J&&!!B.transmissionMap,cJ=_J&&!!B.thicknessMap,tJ=!!B.gradientMap,JJ=!!B.alphaMap,P=B.alphaTest>0,QJ=!!B.alphaHash,XJ=!!B.extensions,BJ=!!l.attributes.uv1,RJ=!!l.attributes.uv2,eJ=!!l.attributes.uv3,Q7=0;if(B.toneMapped){if(LJ===null||LJ.isXRRenderTarget===!0)Q7=J.toneMapping}return{isWebGL2:K,shaderID:u,shaderType:B.type,shaderName:B.name,vertexShader:s,fragmentShader:YJ,defines:B.defines,customVertexShaderID:HJ,customFragmentShaderID:MJ,isRawShaderMaterial:B.isRawShaderMaterial===!0,glslVersion:B.glslVersion,precision:O,batching:CJ,instancing:bJ,instancingColor:bJ&&ZJ.instanceColor!==null,supportsVertexTextures:V,outputColorSpace:LJ===null?J.outputColorSpace:LJ.isXRRenderTarget===!0?LJ.texture.colorSpace:"srgb-linear",map:oJ,matcap:v,envMap:w7,envMapMode:w7&&a.mapping,envMapCubeUVHeight:d,aoMap:dJ,lightMap:OJ,bumpMap:zJ,normalMap:TJ,displacementMap:V&&uJ,emissiveMap:xJ,normalMapObjectSpace:TJ&&B.normalMapType===1,normalMapTangentSpace:TJ&&B.normalMapType===0,metalnessMap:C,roughnessMap:M,anisotropy:h,anisotropyMap:WJ,clearcoat:r,clearcoatMap:UJ,clearcoatNormalMap:FJ,clearcoatRoughnessMap:SJ,iridescence:n,iridescenceMap:i,iridescenceThicknessMap:U7,sheen:o,sheenColorMap:gJ,sheenRoughnessMap:IJ,specularMap:KJ,specularColorMap:EJ,specularIntensityMap:pJ,transmission:_J,transmissionMap:rJ,thicknessMap:cJ,gradientMap:tJ,opaque:B.transparent===!1&&B.blending===1,alphaMap:JJ,alphaTest:P,alphaHash:QJ,combine:B.combine,mapUv:oJ&&R(B.map.channel),aoMapUv:dJ&&R(B.aoMap.channel),lightMapUv:OJ&&R(B.lightMap.channel),bumpMapUv:zJ&&R(B.bumpMap.channel),normalMapUv:TJ&&R(B.normalMap.channel),displacementMapUv:uJ&&R(B.displacementMap.channel),emissiveMapUv:xJ&&R(B.emissiveMap.channel),metalnessMapUv:C&&R(B.metalnessMap.channel),roughnessMapUv:M&&R(B.roughnessMap.channel),anisotropyMapUv:WJ&&R(B.anisotropyMap.channel),clearcoatMapUv:UJ&&R(B.clearcoatMap.channel),clearcoatNormalMapUv:FJ&&R(B.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:SJ&&R(B.clearcoatRoughnessMap.channel),iridescenceMapUv:i&&R(B.iridescenceMap.channel),iridescenceThicknessMapUv:U7&&R(B.iridescenceThicknessMap.channel),sheenColorMapUv:gJ&&R(B.sheenColorMap.channel),sheenRoughnessMapUv:IJ&&R(B.sheenRoughnessMap.channel),specularMapUv:KJ&&R(B.specularMap.channel),specularColorMapUv:EJ&&R(B.specularColorMap.channel),specularIntensityMapUv:pJ&&R(B.specularIntensityMap.channel),transmissionMapUv:rJ&&R(B.transmissionMap.channel),thicknessMapUv:cJ&&R(B.thicknessMap.channel),alphaMapUv:JJ&&R(B.alphaMap.channel),vertexTangents:!!l.attributes.tangent&&(TJ||h),vertexColors:B.vertexColors,vertexAlphas:B.vertexColors===!0&&!!l.attributes.color&&l.attributes.color.itemSize===4,vertexUv1s:BJ,vertexUv2s:RJ,vertexUv3s:eJ,pointsUvs:ZJ.isPoints===!0&&!!l.attributes.uv&&(oJ||JJ),fog:!!A,useFog:B.fog===!0,fogExp2:A&&A.isFogExp2,flatShading:B.flatShading===!0,sizeAttenuation:B.sizeAttenuation===!0,logarithmicDepthBuffer:E,skinning:ZJ.isSkinnedMesh===!0,morphTargets:l.morphAttributes.position!==void 0,morphNormals:l.morphAttributes.normal!==void 0,morphColors:l.morphAttributes.color!==void 0,morphTargetsCount:e,morphTextureStride:x,numDirLights:I.directional.length,numPointLights:I.point.length,numSpotLights:I.spot.length,numSpotLightMaps:I.spotLightMap.length,numRectAreaLights:I.rectArea.length,numHemiLights:I.hemi.length,numDirLightShadows:I.directionalShadowMap.length,numPointLightShadows:I.pointShadowMap.length,numSpotLightShadows:I.spotShadowMap.length,numSpotLightShadowsWithMaps:I.numSpotLightShadowsWithMaps,numLightProbes:I.numLightProbes,numClippingPlanes:H.numPlanes,numClipIntersection:H.numIntersection,dithering:B.dithering,shadowMapEnabled:J.shadowMap.enabled&&y.length>0,shadowMapType:J.shadowMap.type,toneMapping:Q7,useLegacyLights:J._useLegacyLights,decodeVideoTexture:oJ&&B.map.isVideoTexture===!0&&iJ.getTransfer(B.map.colorSpace)==="srgb",premultipliedAlpha:B.premultipliedAlpha,doubleSided:B.side===2,flipSided:B.side===1,useDepthPacking:B.depthPacking>=0,depthPacking:B.depthPacking||0,index0AttributeName:B.index0AttributeName,extensionDerivatives:XJ&&B.extensions.derivatives===!0,extensionFragDepth:XJ&&B.extensions.fragDepth===!0,extensionDrawBuffers:XJ&&B.extensions.drawBuffers===!0,extensionShaderTextureLOD:XJ&&B.extensions.shaderTextureLOD===!0,extensionClipCullDistance:XJ&&B.extensions.clipCullDistance&&Q.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:K||Q.has("EXT_frag_depth"),rendererExtensionDrawBuffers:K||Q.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:K||Q.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:Q.has("KHR_parallel_shader_compile"),customProgramCacheKey:B.customProgramCacheKey()}}function G(B){let I=[];if(B.shaderID)I.push(B.shaderID);else I.push(B.customVertexShaderID),I.push(B.customFragmentShaderID);if(B.defines!==void 0)for(let y in B.defines)I.push(y),I.push(B.defines[y]);if(B.isRawShaderMaterial===!1)N(I,B),z(I,B),I.push(J.outputColorSpace);return I.push(B.customProgramCacheKey),I.join()}function N(B,I){B.push(I.precision),B.push(I.outputColorSpace),B.push(I.envMapMode),B.push(I.envMapCubeUVHeight),B.push(I.mapUv),B.push(I.alphaMapUv),B.push(I.lightMapUv),B.push(I.aoMapUv),B.push(I.bumpMapUv),B.push(I.normalMapUv),B.push(I.displacementMapUv),B.push(I.emissiveMapUv),B.push(I.metalnessMapUv),B.push(I.roughnessMapUv),B.push(I.anisotropyMapUv),B.push(I.clearcoatMapUv),B.push(I.clearcoatNormalMapUv),B.push(I.clearcoatRoughnessMapUv),B.push(I.iridescenceMapUv),B.push(I.iridescenceThicknessMapUv),B.push(I.sheenColorMapUv),B.push(I.sheenRoughnessMapUv),B.push(I.specularMapUv),B.push(I.specularColorMapUv),B.push(I.specularIntensityMapUv),B.push(I.transmissionMapUv),B.push(I.thicknessMapUv),B.push(I.combine),B.push(I.fogExp2),B.push(I.sizeAttenuation),B.push(I.morphTargetsCount),B.push(I.morphAttributeCount),B.push(I.numDirLights),B.push(I.numPointLights),B.push(I.numSpotLights),B.push(I.numSpotLightMaps),B.push(I.numHemiLights),B.push(I.numRectAreaLights),B.push(I.numDirLightShadows),B.push(I.numPointLightShadows),B.push(I.numSpotLightShadows),B.push(I.numSpotLightShadowsWithMaps),B.push(I.numLightProbes),B.push(I.shadowMapType),B.push(I.toneMapping),B.push(I.numClippingPlanes),B.push(I.numClipIntersection),B.push(I.depthPacking)}function z(B,I){if(Y.disableAll(),I.isWebGL2)Y.enable(0);if(I.supportsVertexTextures)Y.enable(1);if(I.instancing)Y.enable(2);if(I.instancingColor)Y.enable(3);if(I.matcap)Y.enable(4);if(I.envMap)Y.enable(5);if(I.normalMapObjectSpace)Y.enable(6);if(I.normalMapTangentSpace)Y.enable(7);if(I.clearcoat)Y.enable(8);if(I.iridescence)Y.enable(9);if(I.alphaTest)Y.enable(10);if(I.vertexColors)Y.enable(11);if(I.vertexAlphas)Y.enable(12);if(I.vertexUv1s)Y.enable(13);if(I.vertexUv2s)Y.enable(14);if(I.vertexUv3s)Y.enable(15);if(I.vertexTangents)Y.enable(16);if(I.anisotropy)Y.enable(17);if(I.alphaHash)Y.enable(18);if(I.batching)Y.enable(19);if(B.push(Y.mask),Y.disableAll(),I.fog)Y.enable(0);if(I.useFog)Y.enable(1);if(I.flatShading)Y.enable(2);if(I.logarithmicDepthBuffer)Y.enable(3);if(I.skinning)Y.enable(4);if(I.morphTargets)Y.enable(5);if(I.morphNormals)Y.enable(6);if(I.morphColors)Y.enable(7);if(I.premultipliedAlpha)Y.enable(8);if(I.shadowMapEnabled)Y.enable(9);if(I.useLegacyLights)Y.enable(10);if(I.doubleSided)Y.enable(11);if(I.flipSided)Y.enable(12);if(I.useDepthPacking)Y.enable(13);if(I.dithering)Y.enable(14);if(I.transmission)Y.enable(15);if(I.sheen)Y.enable(16);if(I.opaque)Y.enable(17);if(I.pointsUvs)Y.enable(18);if(I.decodeVideoTexture)Y.enable(19);B.push(Y.mask)}function w(B){let I=_[B.type],y;if(I){let c=r7[I];y=EW.clone(c.uniforms)}else y=B.uniforms;return y}function k(B,I){let y;for(let c=0,ZJ=U.length;c<ZJ;c++){let A=U[c];if(A.cacheKey===I){y=A,++y.usedTimes;break}}if(y===void 0)y=new MH(J,I,B,X),U.push(y);return y}function L(B){if(--B.usedTimes===0){let I=U.indexOf(B);U[I]=U[U.length-1],U.pop(),B.destroy()}}function S(B){q.remove(B)}function g(){q.dispose()}return{getParameters:F,getProgramCacheKey:G,getUniforms:w,acquireProgram:k,releaseProgram:L,releaseShaderCache:S,programs:U,dispose:g}}function LH(){let J=new WeakMap;function $(X){let H=J.get(X);if(H===void 0)H={},J.set(X,H);return H}function Z(X){J.delete(X)}function Q(X,H,Y){J.get(X)[H]=Y}function W(){J=new WeakMap}return{get:$,remove:Z,update:Q,dispose:W}}function CH(J,$){if(J.groupOrder!==$.groupOrder)return J.groupOrder-$.groupOrder;else if(J.renderOrder!==$.renderOrder)return J.renderOrder-$.renderOrder;else if(J.material.id!==$.material.id)return J.material.id-$.material.id;else if(J.z!==$.z)return J.z-$.z;else return J.id-$.id}function _Z(J,$){if(J.groupOrder!==$.groupOrder)return J.groupOrder-$.groupOrder;else if(J.renderOrder!==$.renderOrder)return J.renderOrder-$.renderOrder;else if(J.z!==$.z)return $.z-J.z;else return J.id-$.id}function NZ(){let J=[],$=0,Z=[],Q=[],W=[];function X(){$=0,Z.length=0,Q.length=0,W.length=0}function H(E,V,O,_,R,F){let G=J[$];if(G===void 0)G={id:E.id,object:E,geometry:V,material:O,groupOrder:_,renderOrder:E.renderOrder,z:R,group:F},J[$]=G;else G.id=E.id,G.object=E,G.geometry=V,G.material=O,G.groupOrder=_,G.renderOrder=E.renderOrder,G.z=R,G.group=F;return $++,G}function Y(E,V,O,_,R,F){let G=H(E,V,O,_,R,F);if(O.transmission>0)Q.push(G);else if(O.transparent===!0)W.push(G);else Z.push(G)}function q(E,V,O,_,R,F){let G=H(E,V,O,_,R,F);if(O.transmission>0)Q.unshift(G);else if(O.transparent===!0)W.unshift(G);else Z.unshift(G)}function U(E,V){if(Z.length>1)Z.sort(E||CH);if(Q.length>1)Q.sort(V||_Z);if(W.length>1)W.sort(V||_Z)}function K(){for(let E=$,V=J.length;E<V;E++){let O=J[E];if(O.id===null)break;O.id=null,O.object=null,O.geometry=null,O.material=null,O.group=null}}return{opaque:Z,transmissive:Q,transparent:W,init:X,push:Y,unshift:q,finish:K,sort:U}}function wH(){let J=new WeakMap;function $(Q,W){let X=J.get(Q),H;if(X===void 0)H=new NZ,J.set(Q,[H]);else if(W>=X.length)H=new NZ,X.push(H);else H=X[W];return H}function Z(){J=new WeakMap}return{get:$,dispose:Z}}function IH(){let J={};return{get:function($){if(J[$.id]!==void 0)return J[$.id];let Z;switch($.type){case"DirectionalLight":Z={direction:new T,color:new GJ};break;case"SpotLight":Z={position:new T,direction:new T,color:new GJ,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":Z={position:new T,color:new GJ,distance:0,decay:0};break;case"HemisphereLight":Z={direction:new T,skyColor:new GJ,groundColor:new GJ};break;case"RectAreaLight":Z={color:new GJ,position:new T,halfWidth:new T,halfHeight:new T};break}return J[$.id]=Z,Z}}}function kH(){let J={};return{get:function($){if(J[$.id]!==void 0)return J[$.id];let Z;switch($.type){case"DirectionalLight":Z={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new yJ};break;case"SpotLight":Z={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new yJ};break;case"PointLight":Z={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new yJ,shadowCameraNear:1,shadowCameraFar:1000};break}return J[$.id]=Z,Z}}}var PH=0;function AH(J,$){return($.castShadow?2:0)-(J.castShadow?2:0)+($.map?1:0)-(J.map?1:0)}function TH(J,$){let Z=new IH,Q=kH(),W={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let K=0;K<9;K++)W.probe.push(new T);let X=new T,H=new AJ,Y=new AJ;function q(K,E){let V=0,O=0,_=0;for(let c=0;c<9;c++)W.probe[c].set(0,0,0);let R=0,F=0,G=0,N=0,z=0,w=0,k=0,L=0,S=0,g=0,B=0;K.sort(AH);let I=E===!0?Math.PI:1;for(let c=0,ZJ=K.length;c<ZJ;c++){let A=K[c],l=A.color,m=A.intensity,a=A.distance,d=A.shadow&&A.shadow.map?A.shadow.map.texture:null;if(A.isAmbientLight)V+=l.r*m*I,O+=l.g*m*I,_+=l.b*m*I;else if(A.isLightProbe){for(let u=0;u<9;u++)W.probe[u].addScaledVector(A.sh.coefficients[u],m);B++}else if(A.isDirectionalLight){let u=Z.get(A);if(u.color.copy(A.color).multiplyScalar(A.intensity*I),A.castShadow){let t=A.shadow,e=Q.get(A);e.shadowBias=t.bias,e.shadowNormalBias=t.normalBias,e.shadowRadius=t.radius,e.shadowMapSize=t.mapSize,W.directionalShadow[R]=e,W.directionalShadowMap[R]=d,W.directionalShadowMatrix[R]=A.shadow.matrix,w++}W.directional[R]=u,R++}else if(A.isSpotLight){let u=Z.get(A);u.position.setFromMatrixPosition(A.matrixWorld),u.color.copy(l).multiplyScalar(m*I),u.distance=a,u.coneCos=Math.cos(A.angle),u.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),u.decay=A.decay,W.spot[G]=u;let t=A.shadow;if(A.map){if(W.spotLightMap[S]=A.map,S++,t.updateMatrices(A),A.castShadow)g++}if(W.spotLightMatrix[G]=t.matrix,A.castShadow){let e=Q.get(A);e.shadowBias=t.bias,e.shadowNormalBias=t.normalBias,e.shadowRadius=t.radius,e.shadowMapSize=t.mapSize,W.spotShadow[G]=e,W.spotShadowMap[G]=d,L++}G++}else if(A.isRectAreaLight){let u=Z.get(A);u.color.copy(l).multiplyScalar(m),u.halfWidth.set(A.width*0.5,0,0),u.halfHeight.set(0,A.height*0.5,0),W.rectArea[N]=u,N++}else if(A.isPointLight){let u=Z.get(A);if(u.color.copy(A.color).multiplyScalar(A.intensity*I),u.distance=A.distance,u.decay=A.decay,A.castShadow){let t=A.shadow,e=Q.get(A);e.shadowBias=t.bias,e.shadowNormalBias=t.normalBias,e.shadowRadius=t.radius,e.shadowMapSize=t.mapSize,e.shadowCameraNear=t.camera.near,e.shadowCameraFar=t.camera.far,W.pointShadow[F]=e,W.pointShadowMap[F]=d,W.pointShadowMatrix[F]=A.shadow.matrix,k++}W.point[F]=u,F++}else if(A.isHemisphereLight){let u=Z.get(A);u.skyColor.copy(A.color).multiplyScalar(m*I),u.groundColor.copy(A.groundColor).multiplyScalar(m*I),W.hemi[z]=u,z++}}if(N>0)if($.isWebGL2)if(J.has("OES_texture_float_linear")===!0)W.rectAreaLTC1=$J.LTC_FLOAT_1,W.rectAreaLTC2=$J.LTC_FLOAT_2;else W.rectAreaLTC1=$J.LTC_HALF_1,W.rectAreaLTC2=$J.LTC_HALF_2;else if(J.has("OES_texture_float_linear")===!0)W.rectAreaLTC1=$J.LTC_FLOAT_1,W.rectAreaLTC2=$J.LTC_FLOAT_2;else if(J.has("OES_texture_half_float_linear")===!0)W.rectAreaLTC1=$J.LTC_HALF_1,W.rectAreaLTC2=$J.LTC_HALF_2;else console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.");W.ambient[0]=V,W.ambient[1]=O,W.ambient[2]=_;let y=W.hash;if(y.directionalLength!==R||y.pointLength!==F||y.spotLength!==G||y.rectAreaLength!==N||y.hemiLength!==z||y.numDirectionalShadows!==w||y.numPointShadows!==k||y.numSpotShadows!==L||y.numSpotMaps!==S||y.numLightProbes!==B)W.directional.length=R,W.spot.length=G,W.rectArea.length=N,W.point.length=F,W.hemi.length=z,W.directionalShadow.length=w,W.directionalShadowMap.length=w,W.pointShadow.length=k,W.pointShadowMap.length=k,W.spotShadow.length=L,W.spotShadowMap.length=L,W.directionalShadowMatrix.length=w,W.pointShadowMatrix.length=k,W.spotLightMatrix.length=L+S-g,W.spotLightMap.length=S,W.numSpotLightShadowsWithMaps=g,W.numLightProbes=B,y.directionalLength=R,y.pointLength=F,y.spotLength=G,y.rectAreaLength=N,y.hemiLength=z,y.numDirectionalShadows=w,y.numPointShadows=k,y.numSpotShadows=L,y.numSpotMaps=S,y.numLightProbes=B,W.version=PH++}function U(K,E){let V=0,O=0,_=0,R=0,F=0,G=E.matrixWorldInverse;for(let N=0,z=K.length;N<z;N++){let w=K[N];if(w.isDirectionalLight){let k=W.directional[V];k.direction.setFromMatrixPosition(w.matrixWorld),X.setFromMatrixPosition(w.target.matrixWorld),k.direction.sub(X),k.direction.transformDirection(G),V++}else if(w.isSpotLight){let k=W.spot[_];k.position.setFromMatrixPosition(w.matrixWorld),k.position.applyMatrix4(G),k.direction.setFromMatrixPosition(w.matrixWorld),X.setFromMatrixPosition(w.target.matrixWorld),k.direction.sub(X),k.direction.transformDirection(G),_++}else if(w.isRectAreaLight){let k=W.rectArea[R];k.position.setFromMatrixPosition(w.matrixWorld),k.position.applyMatrix4(G),Y.identity(),H.copy(w.matrixWorld),H.premultiply(G),Y.extractRotation(H),k.halfWidth.set(w.width*0.5,0,0),k.halfHeight.set(0,w.height*0.5,0),k.halfWidth.applyMatrix4(Y),k.halfHeight.applyMatrix4(Y),R++}else if(w.isPointLight){let k=W.point[O];k.position.setFromMatrixPosition(w.matrixWorld),k.position.applyMatrix4(G),O++}else if(w.isHemisphereLight){let k=W.hemi[F];k.direction.setFromMatrixPosition(w.matrixWorld),k.direction.transformDirection(G),F++}}}return{setup:q,setupView:U,state:W}}function zZ(J,$){let Z=new TH(J,$),Q=[],W=[];function X(){Q.length=0,W.length=0}function H(E){Q.push(E)}function Y(E){W.push(E)}function q(E){Z.setup(Q,E)}function U(E){Z.setupView(Q,E)}return{init:X,state:{lightsArray:Q,shadowsArray:W,lights:Z},setupLights:q,setupLightsView:U,pushLight:H,pushShadow:Y}}function SH(J,$){let Z=new WeakMap;function Q(X,H=0){let Y=Z.get(X),q;if(Y===void 0)q=new zZ(J,$),Z.set(X,[q]);else if(H>=Y.length)q=new zZ(J,$),Y.push(q);else q=Y[H];return q}function W(){Z=new WeakMap}return{get:Q,dispose:W}}class F5 extends x7{constructor(J){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(J)}copy(J){return super.copy(J),this.depthPacking=J.depthPacking,this.map=J.map,this.alphaMap=J.alphaMap,this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this}}class O5 extends x7{constructor(J){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(J)}copy(J){return super.copy(J),this.map=J.map,this.alphaMap=J.alphaMap,this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this}}var jH=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,vH=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function yH(J,$,Z){let Q=new j0,W=new yJ,X=new yJ,H=new J7,Y=new F5({depthPacking:3201}),q=new O5,U={},K=Z.maxTextureSize,E={[0]:1,[1]:0,[2]:2},V=new _9({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new yJ},radius:{value:4}},vertexShader:jH,fragmentShader:vH}),O=V.clone();O.defines.HORIZONTAL_PASS=1;let _=new E7;_.setAttribute("position",new Z7(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let R=new H7(_,V),F=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let G=this.type;this.render=function(L,S,g){if(F.enabled===!1)return;if(F.autoUpdate===!1&&F.needsUpdate===!1)return;if(L.length===0)return;let B=J.getRenderTarget(),I=J.getActiveCubeFace(),y=J.getActiveMipmapLevel(),c=J.state;c.setBlending(0),c.buffers.color.setClear(1,1,1,1),c.buffers.depth.setTest(!0),c.setScissorTest(!1);let ZJ=G!==3&&this.type===3,A=G===3&&this.type!==3;for(let l=0,m=L.length;l<m;l++){let a=L[l],d=a.shadow;if(d===void 0){console.warn("THREE.WebGLShadowMap:",a,"has no shadow.");continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;W.copy(d.mapSize);let u=d.getFrameExtents();if(W.multiply(u),X.copy(d.mapSize),W.x>K||W.y>K){if(W.x>K)X.x=Math.floor(K/u.x),W.x=X.x*u.x,d.mapSize.x=X.x;if(W.y>K)X.y=Math.floor(K/u.y),W.y=X.y*u.y,d.mapSize.y=X.y}if(d.map===null||ZJ===!0||A===!0){let e=this.type!==3?{minFilter:1003,magFilter:1003}:{};if(d.map!==null)d.map.dispose();d.map=new R9(W.x,W.y,e),d.map.texture.name=a.name+".shadowMap",d.camera.updateProjectionMatrix()}J.setRenderTarget(d.map),J.clear();let t=d.getViewportCount();for(let e=0;e<t;e++){let x=d.getViewport(e);H.set(X.x*x.x,X.y*x.y,X.x*x.z,X.y*x.w),c.viewport(H),d.updateMatrices(a,e),Q=d.getFrustum(),w(S,g,d.camera,a,this.type)}if(d.isPointLightShadow!==!0&&this.type===3)N(d,g);d.needsUpdate=!1}G=this.type,F.needsUpdate=!1,J.setRenderTarget(B,I,y)};function N(L,S){let g=$.update(R);if(V.defines.VSM_SAMPLES!==L.blurSamples)V.defines.VSM_SAMPLES=L.blurSamples,O.defines.VSM_SAMPLES=L.blurSamples,V.needsUpdate=!0,O.needsUpdate=!0;if(L.mapPass===null)L.mapPass=new R9(W.x,W.y);V.uniforms.shadow_pass.value=L.map.texture,V.uniforms.resolution.value=L.mapSize,V.uniforms.radius.value=L.radius,J.setRenderTarget(L.mapPass),J.clear(),J.renderBufferDirect(S,null,g,V,R,null),O.uniforms.shadow_pass.value=L.mapPass.texture,O.uniforms.resolution.value=L.mapSize,O.uniforms.radius.value=L.radius,J.setRenderTarget(L.map),J.clear(),J.renderBufferDirect(S,null,g,O,R,null)}function z(L,S,g,B){let I=null,y=g.isPointLight===!0?L.customDistanceMaterial:L.customDepthMaterial;if(y!==void 0)I=y;else if(I=g.isPointLight===!0?q:Y,J.localClippingEnabled&&S.clipShadows===!0&&Array.isArray(S.clippingPlanes)&&S.clippingPlanes.length!==0||S.displacementMap&&S.displacementScale!==0||S.alphaMap&&S.alphaTest>0||S.map&&S.alphaTest>0){let c=I.uuid,ZJ=S.uuid,A=U[c];if(A===void 0)A={},U[c]=A;let l=A[ZJ];if(l===void 0)l=I.clone(),A[ZJ]=l,S.addEventListener("dispose",k);I=l}if(I.visible=S.visible,I.wireframe=S.wireframe,B===3)I.side=S.shadowSide!==null?S.shadowSide:S.side;else I.side=S.shadowSide!==null?S.shadowSide:E[S.side];if(I.alphaMap=S.alphaMap,I.alphaTest=S.alphaTest,I.map=S.map,I.clipShadows=S.clipShadows,I.clippingPlanes=S.clippingPlanes,I.clipIntersection=S.clipIntersection,I.displacementMap=S.displacementMap,I.displacementScale=S.displacementScale,I.displacementBias=S.displacementBias,I.wireframeLinewidth=S.wireframeLinewidth,I.linewidth=S.linewidth,g.isPointLight===!0&&I.isMeshDistanceMaterial===!0){let c=J.properties.get(I);c.light=g}return I}function w(L,S,g,B,I){if(L.visible===!1)return;if(L.layers.test(S.layers)&&(L.isMesh||L.isLine||L.isPoints)){if((L.castShadow||L.receiveShadow&&I===3)&&(!L.frustumCulled||Q.intersectsObject(L))){L.modelViewMatrix.multiplyMatrices(g.matrixWorldInverse,L.matrixWorld);let ZJ=$.update(L),A=L.material;if(Array.isArray(A)){let l=ZJ.groups;for(let m=0,a=l.length;m<a;m++){let d=l[m],u=A[d.materialIndex];if(u&&u.visible){let t=z(L,u,B,I);L.onBeforeShadow(J,L,S,g,ZJ,t,d),J.renderBufferDirect(g,null,ZJ,t,L,d),L.onAfterShadow(J,L,S,g,ZJ,t,d)}}}else if(A.visible){let l=z(L,A,B,I);L.onBeforeShadow(J,L,S,g,ZJ,l,null),J.renderBufferDirect(g,null,ZJ,l,L,null),L.onAfterShadow(J,L,S,g,ZJ,l,null)}}}let c=L.children;for(let ZJ=0,A=c.length;ZJ<A;ZJ++)w(c[ZJ],S,g,B,I)}function k(L){L.target.removeEventListener("dispose",k);for(let g in U){let B=U[g],I=L.target.uuid;if(I in B)B[I].dispose(),delete B[I]}}}function xH(J,$,Z){let Q=Z.isWebGL2;function W(){let P=!1,QJ=new J7,XJ=null,BJ=new J7(0,0,0,0);return{setMask:function(RJ){if(XJ!==RJ&&!P)J.colorMask(RJ,RJ,RJ,RJ),XJ=RJ},setLocked:function(RJ){P=RJ},setClear:function(RJ,eJ,Q7,F7,I7){if(I7===!0)RJ*=F7,eJ*=F7,Q7*=F7;if(QJ.set(RJ,eJ,Q7,F7),BJ.equals(QJ)===!1)J.clearColor(RJ,eJ,Q7,F7),BJ.copy(QJ)},reset:function(){P=!1,XJ=null,BJ.set(-1,0,0,0)}}}function X(){let P=!1,QJ=null,XJ=null,BJ=null;return{setTest:function(RJ){if(RJ)CJ(J.DEPTH_TEST);else oJ(J.DEPTH_TEST)},setMask:function(RJ){if(QJ!==RJ&&!P)J.depthMask(RJ),QJ=RJ},setFunc:function(RJ){if(XJ!==RJ){switch(RJ){case 0:J.depthFunc(J.NEVER);break;case 1:J.depthFunc(J.ALWAYS);break;case 2:J.depthFunc(J.LESS);break;case 3:J.depthFunc(J.LEQUAL);break;case 4:J.depthFunc(J.EQUAL);break;case 5:J.depthFunc(J.GEQUAL);break;case 6:J.depthFunc(J.GREATER);break;case 7:J.depthFunc(J.NOTEQUAL);break;default:J.depthFunc(J.LEQUAL)}XJ=RJ}},setLocked:function(RJ){P=RJ},setClear:function(RJ){if(BJ!==RJ)J.clearDepth(RJ),BJ=RJ},reset:function(){P=!1,QJ=null,XJ=null,BJ=null}}}function H(){let P=!1,QJ=null,XJ=null,BJ=null,RJ=null,eJ=null,Q7=null,F7=null,I7=null;return{setTest:function(nJ){if(!P)if(nJ)CJ(J.STENCIL_TEST);else oJ(J.STENCIL_TEST)},setMask:function(nJ){if(QJ!==nJ&&!P)J.stencilMask(nJ),QJ=nJ},setFunc:function(nJ,o7,a7){if(XJ!==nJ||BJ!==o7||RJ!==a7)J.stencilFunc(nJ,o7,a7),XJ=nJ,BJ=o7,RJ=a7},setOp:function(nJ,o7,a7){if(eJ!==nJ||Q7!==o7||F7!==a7)J.stencilOp(nJ,o7,a7),eJ=nJ,Q7=o7,F7=a7},setLocked:function(nJ){P=nJ},setClear:function(nJ){if(I7!==nJ)J.clearStencil(nJ),I7=nJ},reset:function(){P=!1,QJ=null,XJ=null,BJ=null,RJ=null,eJ=null,Q7=null,F7=null,I7=null}}}let Y=new W,q=new X,U=new H,K=new WeakMap,E=new WeakMap,V={},O={},_=new WeakMap,R=[],F=null,G=!1,N=null,z=null,w=null,k=null,L=null,S=null,g=null,B=new GJ(0,0,0),I=0,y=!1,c=null,ZJ=null,A=null,l=null,m=null,a=J.getParameter(J.MAX_COMBINED_TEXTURE_IMAGE_UNITS),d=!1,u=0,t=J.getParameter(J.VERSION);if(t.indexOf("WebGL")!==-1)u=parseFloat(/^WebGL (\d)/.exec(t)[1]),d=u>=1;else if(t.indexOf("OpenGL ES")!==-1)u=parseFloat(/^OpenGL ES (\d)/.exec(t)[1]),d=u>=2;let e=null,x={},s=J.getParameter(J.SCISSOR_BOX),YJ=J.getParameter(J.VIEWPORT),HJ=new J7().fromArray(s),MJ=new J7().fromArray(YJ);function LJ(P,QJ,XJ,BJ){let RJ=new Uint8Array(4),eJ=J.createTexture();J.bindTexture(P,eJ),J.texParameteri(P,J.TEXTURE_MIN_FILTER,J.NEAREST),J.texParameteri(P,J.TEXTURE_MAG_FILTER,J.NEAREST);for(let Q7=0;Q7<XJ;Q7++)if(Q&&(P===J.TEXTURE_3D||P===J.TEXTURE_2D_ARRAY))J.texImage3D(QJ,0,J.RGBA,1,1,BJ,0,J.RGBA,J.UNSIGNED_BYTE,RJ);else J.texImage2D(QJ+Q7,0,J.RGBA,1,1,0,J.RGBA,J.UNSIGNED_BYTE,RJ);return eJ}let bJ={};if(bJ[J.TEXTURE_2D]=LJ(J.TEXTURE_2D,J.TEXTURE_2D,1),bJ[J.TEXTURE_CUBE_MAP]=LJ(J.TEXTURE_CUBE_MAP,J.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q)bJ[J.TEXTURE_2D_ARRAY]=LJ(J.TEXTURE_2D_ARRAY,J.TEXTURE_2D_ARRAY,1,1),bJ[J.TEXTURE_3D]=LJ(J.TEXTURE_3D,J.TEXTURE_3D,1,1);Y.setClear(0,0,0,1),q.setClear(1),U.setClear(0),CJ(J.DEPTH_TEST),q.setFunc(3),xJ(!1),C(1),CJ(J.CULL_FACE),TJ(0);function CJ(P){if(V[P]!==!0)J.enable(P),V[P]=!0}function oJ(P){if(V[P]!==!1)J.disable(P),V[P]=!1}function v(P,QJ){if(O[P]!==QJ){if(J.bindFramebuffer(P,QJ),O[P]=QJ,Q){if(P===J.DRAW_FRAMEBUFFER)O[J.FRAMEBUFFER]=QJ;if(P===J.FRAMEBUFFER)O[J.DRAW_FRAMEBUFFER]=QJ}return!0}return!1}function w7(P,QJ){let XJ=R,BJ=!1;if(P){if(XJ=_.get(QJ),XJ===void 0)XJ=[],_.set(QJ,XJ);if(P.isWebGLMultipleRenderTargets){let RJ=P.texture;if(XJ.length!==RJ.length||XJ[0]!==J.COLOR_ATTACHMENT0){for(let eJ=0,Q7=RJ.length;eJ<Q7;eJ++)XJ[eJ]=J.COLOR_ATTACHMENT0+eJ;XJ.length=RJ.length,BJ=!0}}else if(XJ[0]!==J.COLOR_ATTACHMENT0)XJ[0]=J.COLOR_ATTACHMENT0,BJ=!0}else if(XJ[0]!==J.BACK)XJ[0]=J.BACK,BJ=!0;if(BJ)if(Z.isWebGL2)J.drawBuffers(XJ);else $.get("WEBGL_draw_buffers").drawBuffersWEBGL(XJ)}function dJ(P){if(F!==P)return J.useProgram(P),F=P,!0;return!1}let OJ={[100]:J.FUNC_ADD,[101]:J.FUNC_SUBTRACT,[102]:J.FUNC_REVERSE_SUBTRACT};if(Q)OJ[103]=J.MIN,OJ[104]=J.MAX;else{let P=$.get("EXT_blend_minmax");if(P!==null)OJ[103]=P.MIN_EXT,OJ[104]=P.MAX_EXT}let zJ={[200]:J.ZERO,[201]:J.ONE,[202]:J.SRC_COLOR,[204]:J.SRC_ALPHA,[210]:J.SRC_ALPHA_SATURATE,[208]:J.DST_COLOR,[206]:J.DST_ALPHA,[203]:J.ONE_MINUS_SRC_COLOR,[205]:J.ONE_MINUS_SRC_ALPHA,[209]:J.ONE_MINUS_DST_COLOR,[207]:J.ONE_MINUS_DST_ALPHA,[211]:J.CONSTANT_COLOR,[212]:J.ONE_MINUS_CONSTANT_COLOR,[213]:J.CONSTANT_ALPHA,[214]:J.ONE_MINUS_CONSTANT_ALPHA};function TJ(P,QJ,XJ,BJ,RJ,eJ,Q7,F7,I7,nJ){if(P===0){if(G===!0)oJ(J.BLEND),G=!1;return}if(G===!1)CJ(J.BLEND),G=!0;if(P!==5){if(P!==N||nJ!==y){if(z!==100||L!==100)J.blendEquation(J.FUNC_ADD),z=100,L=100;if(nJ)switch(P){case 1:J.blendFuncSeparate(J.ONE,J.ONE_MINUS_SRC_ALPHA,J.ONE,J.ONE_MINUS_SRC_ALPHA);break;case 2:J.blendFunc(J.ONE,J.ONE);break;case 3:J.blendFuncSeparate(J.ZERO,J.ONE_MINUS_SRC_COLOR,J.ZERO,J.ONE);break;case 4:J.blendFuncSeparate(J.ZERO,J.SRC_COLOR,J.ZERO,J.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case 1:J.blendFuncSeparate(J.SRC_ALPHA,J.ONE_MINUS_SRC_ALPHA,J.ONE,J.ONE_MINUS_SRC_ALPHA);break;case 2:J.blendFunc(J.SRC_ALPHA,J.ONE);break;case 3:J.blendFuncSeparate(J.ZERO,J.ONE_MINUS_SRC_COLOR,J.ZERO,J.ONE);break;case 4:J.blendFunc(J.ZERO,J.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}w=null,k=null,S=null,g=null,B.set(0,0,0),I=0,N=P,y=nJ}return}if(RJ=RJ||QJ,eJ=eJ||XJ,Q7=Q7||BJ,QJ!==z||RJ!==L)J.blendEquationSeparate(OJ[QJ],OJ[RJ]),z=QJ,L=RJ;if(XJ!==w||BJ!==k||eJ!==S||Q7!==g)J.blendFuncSeparate(zJ[XJ],zJ[BJ],zJ[eJ],zJ[Q7]),w=XJ,k=BJ,S=eJ,g=Q7;if(F7.equals(B)===!1||I7!==I)J.blendColor(F7.r,F7.g,F7.b,I7),B.copy(F7),I=I7;N=P,y=!1}function uJ(P,QJ){P.side===2?oJ(J.CULL_FACE):CJ(J.CULL_FACE);let XJ=P.side===1;if(QJ)XJ=!XJ;xJ(XJ),P.blending===1&&P.transparent===!1?TJ(0):TJ(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),q.setFunc(P.depthFunc),q.setTest(P.depthTest),q.setMask(P.depthWrite),Y.setMask(P.colorWrite);let BJ=P.stencilWrite;if(U.setTest(BJ),BJ)U.setMask(P.stencilWriteMask),U.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),U.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass);h(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?CJ(J.SAMPLE_ALPHA_TO_COVERAGE):oJ(J.SAMPLE_ALPHA_TO_COVERAGE)}function xJ(P){if(c!==P){if(P)J.frontFace(J.CW);else J.frontFace(J.CCW);c=P}}function C(P){if(P!==0){if(CJ(J.CULL_FACE),P!==ZJ)if(P===1)J.cullFace(J.BACK);else if(P===2)J.cullFace(J.FRONT);else J.cullFace(J.FRONT_AND_BACK)}else oJ(J.CULL_FACE);ZJ=P}function M(P){if(P!==A){if(d)J.lineWidth(P);A=P}}function h(P,QJ,XJ){if(P){if(CJ(J.POLYGON_OFFSET_FILL),l!==QJ||m!==XJ)J.polygonOffset(QJ,XJ),l=QJ,m=XJ}else oJ(J.POLYGON_OFFSET_FILL)}function r(P){if(P)CJ(J.SCISSOR_TEST);else oJ(J.SCISSOR_TEST)}function n(P){if(P===void 0)P=J.TEXTURE0+a-1;if(e!==P)J.activeTexture(P),e=P}function o(P,QJ,XJ){if(XJ===void 0)if(e===null)XJ=J.TEXTURE0+a-1;else XJ=e;let BJ=x[XJ];if(BJ===void 0)BJ={type:void 0,texture:void 0},x[XJ]=BJ;if(BJ.type!==P||BJ.texture!==QJ){if(e!==XJ)J.activeTexture(XJ),e=XJ;J.bindTexture(P,QJ||bJ[P]),BJ.type=P,BJ.texture=QJ}}function _J(){let P=x[e];if(P!==void 0&&P.type!==void 0)J.bindTexture(P.type,null),P.type=void 0,P.texture=void 0}function WJ(){try{J.compressedTexImage2D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function UJ(){try{J.compressedTexImage3D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function FJ(){try{J.texSubImage2D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function SJ(){try{J.texSubImage3D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function i(){try{J.compressedTexSubImage2D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function U7(){try{J.compressedTexSubImage3D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function gJ(){try{J.texStorage2D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function IJ(){try{J.texStorage3D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function KJ(){try{J.texImage2D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function EJ(){try{J.texImage3D.apply(J,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function pJ(P){if(HJ.equals(P)===!1)J.scissor(P.x,P.y,P.z,P.w),HJ.copy(P)}function rJ(P){if(MJ.equals(P)===!1)J.viewport(P.x,P.y,P.z,P.w),MJ.copy(P)}function cJ(P,QJ){let XJ=E.get(QJ);if(XJ===void 0)XJ=new WeakMap,E.set(QJ,XJ);let BJ=XJ.get(P);if(BJ===void 0)BJ=J.getUniformBlockIndex(QJ,P.name),XJ.set(P,BJ)}function tJ(P,QJ){let BJ=E.get(QJ).get(P);if(K.get(QJ)!==BJ)J.uniformBlockBinding(QJ,BJ,P.__bindingPointIndex),K.set(QJ,BJ)}function JJ(){if(J.disable(J.BLEND),J.disable(J.CULL_FACE),J.disable(J.DEPTH_TEST),J.disable(J.POLYGON_OFFSET_FILL),J.disable(J.SCISSOR_TEST),J.disable(J.STENCIL_TEST),J.disable(J.SAMPLE_ALPHA_TO_COVERAGE),J.blendEquation(J.FUNC_ADD),J.blendFunc(J.ONE,J.ZERO),J.blendFuncSeparate(J.ONE,J.ZERO,J.ONE,J.ZERO),J.blendColor(0,0,0,0),J.colorMask(!0,!0,!0,!0),J.clearColor(0,0,0,0),J.depthMask(!0),J.depthFunc(J.LESS),J.clearDepth(1),J.stencilMask(4294967295),J.stencilFunc(J.ALWAYS,0,4294967295),J.stencilOp(J.KEEP,J.KEEP,J.KEEP),J.clearStencil(0),J.cullFace(J.BACK),J.frontFace(J.CCW),J.polygonOffset(0,0),J.activeTexture(J.TEXTURE0),J.bindFramebuffer(J.FRAMEBUFFER,null),Q===!0)J.bindFramebuffer(J.DRAW_FRAMEBUFFER,null),J.bindFramebuffer(J.READ_FRAMEBUFFER,null);J.useProgram(null),J.lineWidth(1),J.scissor(0,0,J.canvas.width,J.canvas.height),J.viewport(0,0,J.canvas.width,J.canvas.height),V={},e=null,x={},O={},_=new WeakMap,R=[],F=null,G=!1,N=null,z=null,w=null,k=null,L=null,S=null,g=null,B=new GJ(0,0,0),I=0,y=!1,c=null,ZJ=null,A=null,l=null,m=null,HJ.set(0,0,J.canvas.width,J.canvas.height),MJ.set(0,0,J.canvas.width,J.canvas.height),Y.reset(),q.reset(),U.reset()}return{buffers:{color:Y,depth:q,stencil:U},enable:CJ,disable:oJ,bindFramebuffer:v,drawBuffers:w7,useProgram:dJ,setBlending:TJ,setMaterial:uJ,setFlipSided:xJ,setCullFace:C,setLineWidth:M,setPolygonOffset:h,setScissorTest:r,activeTexture:n,bindTexture:o,unbindTexture:_J,compressedTexImage2D:WJ,compressedTexImage3D:UJ,texImage2D:KJ,texImage3D:EJ,updateUBOMapping:cJ,uniformBlockBinding:tJ,texStorage2D:gJ,texStorage3D:IJ,texSubImage2D:FJ,texSubImage3D:SJ,compressedTexSubImage2D:i,compressedTexSubImage3D:U7,scissor:pJ,viewport:rJ,reset:JJ}}function fH(J,$,Z,Q,W,X,H){let Y=W.isWebGL2,q=$.has("WEBGL_multisampled_render_to_texture")?$.get("WEBGL_multisampled_render_to_texture"):null,U=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),K=new WeakMap,E,V=new WeakMap,O=!1;try{O=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(C){}function _(C,M){return O?new OffscreenCanvas(C,M):T$("canvas")}function R(C,M,h,r){let n=1;if(C.width>r||C.height>r)n=r/Math.max(C.width,C.height);if(n<1||M===!0)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap){let o=M?A0:Math.floor,_J=o(n*C.width),WJ=o(n*C.height);if(E===void 0)E=_(_J,WJ);let UJ=h?_(_J,WJ):E;return UJ.width=_J,UJ.height=WJ,UJ.getContext("2d").drawImage(C,0,0,_J,WJ),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+C.width+"x"+C.height+") to ("+_J+"x"+WJ+")."),UJ}else{if("data"in C)console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+C.width+"x"+C.height+").");return C}return C}function F(C){return k8(C.width)&&k8(C.height)}function G(C){if(Y)return!1;return C.wrapS!==1001||C.wrapT!==1001||C.minFilter!==1003&&C.minFilter!==1006}function N(C,M){return C.generateMipmaps&&M&&C.minFilter!==1003&&C.minFilter!==1006}function z(C){J.generateMipmap(C)}function w(C,M,h,r,n=!1){if(Y===!1)return M;if(C!==null){if(J[C]!==void 0)return J[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let o=M;if(M===J.RED){if(h===J.FLOAT)o=J.R32F;if(h===J.HALF_FLOAT)o=J.R16F;if(h===J.UNSIGNED_BYTE)o=J.R8}if(M===J.RED_INTEGER){if(h===J.UNSIGNED_BYTE)o=J.R8UI;if(h===J.UNSIGNED_SHORT)o=J.R16UI;if(h===J.UNSIGNED_INT)o=J.R32UI;if(h===J.BYTE)o=J.R8I;if(h===J.SHORT)o=J.R16I;if(h===J.INT)o=J.R32I}if(M===J.RG){if(h===J.FLOAT)o=J.RG32F;if(h===J.HALF_FLOAT)o=J.RG16F;if(h===J.UNSIGNED_BYTE)o=J.RG8}if(M===J.RGBA){let _J=n?"linear":iJ.getTransfer(r);if(h===J.FLOAT)o=J.RGBA32F;if(h===J.HALF_FLOAT)o=J.RGBA16F;if(h===J.UNSIGNED_BYTE)o=_J==="srgb"?J.SRGB8_ALPHA8:J.RGBA8;if(h===J.UNSIGNED_SHORT_4_4_4_4)o=J.RGBA4;if(h===J.UNSIGNED_SHORT_5_5_5_1)o=J.RGB5_A1}if(o===J.R16F||o===J.R32F||o===J.RG16F||o===J.RG32F||o===J.RGBA16F||o===J.RGBA32F)$.get("EXT_color_buffer_float");return o}function k(C,M,h){if(N(C,h)===!0||C.isFramebufferTexture&&C.minFilter!==1003&&C.minFilter!==1006)return Math.log2(Math.max(M.width,M.height))+1;else if(C.mipmaps!==void 0&&C.mipmaps.length>0)return C.mipmaps.length;else if(C.isCompressedTexture&&Array.isArray(C.image))return M.mipmaps.length;else return 1}function L(C){if(C===1003||C===1004||C===1005)return J.NEAREST;return J.LINEAR}function S(C){let M=C.target;if(M.removeEventListener("dispose",S),B(M),M.isVideoTexture)K.delete(M)}function g(C){let M=C.target;M.removeEventListener("dispose",g),y(M)}function B(C){let M=Q.get(C);if(M.__webglInit===void 0)return;let h=C.source,r=V.get(h);if(r){let n=r[M.__cacheKey];if(n.usedTimes--,n.usedTimes===0)I(C);if(Object.keys(r).length===0)V.delete(h)}Q.remove(C)}function I(C){let M=Q.get(C);J.deleteTexture(M.__webglTexture);let h=C.source,r=V.get(h);delete r[M.__cacheKey],H.memory.textures--}function y(C){let M=C.texture,h=Q.get(C),r=Q.get(M);if(r.__webglTexture!==void 0)J.deleteTexture(r.__webglTexture),H.memory.textures--;if(C.depthTexture)C.depthTexture.dispose();if(C.isWebGLCubeRenderTarget)for(let n=0;n<6;n++){if(Array.isArray(h.__webglFramebuffer[n]))for(let o=0;o<h.__webglFramebuffer[n].length;o++)J.deleteFramebuffer(h.__webglFramebuffer[n][o]);else J.deleteFramebuffer(h.__webglFramebuffer[n]);if(h.__webglDepthbuffer)J.deleteRenderbuffer(h.__webglDepthbuffer[n])}else{if(Array.isArray(h.__webglFramebuffer))for(let n=0;n<h.__webglFramebuffer.length;n++)J.deleteFramebuffer(h.__webglFramebuffer[n]);else J.deleteFramebuffer(h.__webglFramebuffer);if(h.__webglDepthbuffer)J.deleteRenderbuffer(h.__webglDepthbuffer);if(h.__webglMultisampledFramebuffer)J.deleteFramebuffer(h.__webglMultisampledFramebuffer);if(h.__webglColorRenderbuffer){for(let n=0;n<h.__webglColorRenderbuffer.length;n++)if(h.__webglColorRenderbuffer[n])J.deleteRenderbuffer(h.__webglColorRenderbuffer[n])}if(h.__webglDepthRenderbuffer)J.deleteRenderbuffer(h.__webglDepthRenderbuffer)}if(C.isWebGLMultipleRenderTargets)for(let n=0,o=M.length;n<o;n++){let _J=Q.get(M[n]);if(_J.__webglTexture)J.deleteTexture(_J.__webglTexture),H.memory.textures--;Q.remove(M[n])}Q.remove(M),Q.remove(C)}let c=0;function ZJ(){c=0}function A(){let C=c;if(C>=W.maxTextures)console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+W.maxTextures);return c+=1,C}function l(C){let M=[];return M.push(C.wrapS),M.push(C.wrapT),M.push(C.wrapR||0),M.push(C.magFilter),M.push(C.minFilter),M.push(C.anisotropy),M.push(C.internalFormat),M.push(C.format),M.push(C.type),M.push(C.generateMipmaps),M.push(C.premultiplyAlpha),M.push(C.flipY),M.push(C.unpackAlignment),M.push(C.colorSpace),M.join()}function m(C,M){let h=Q.get(C);if(C.isVideoTexture)uJ(C);if(C.isRenderTargetTexture===!1&&C.version>0&&h.__version!==C.version){let r=C.image;if(r===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(r.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{HJ(h,C,M);return}}Z.bindTexture(J.TEXTURE_2D,h.__webglTexture,J.TEXTURE0+M)}function a(C,M){let h=Q.get(C);if(C.version>0&&h.__version!==C.version){HJ(h,C,M);return}Z.bindTexture(J.TEXTURE_2D_ARRAY,h.__webglTexture,J.TEXTURE0+M)}function d(C,M){let h=Q.get(C);if(C.version>0&&h.__version!==C.version){HJ(h,C,M);return}Z.bindTexture(J.TEXTURE_3D,h.__webglTexture,J.TEXTURE0+M)}function u(C,M){let h=Q.get(C);if(C.version>0&&h.__version!==C.version){MJ(h,C,M);return}Z.bindTexture(J.TEXTURE_CUBE_MAP,h.__webglTexture,J.TEXTURE0+M)}let t={[1000]:J.REPEAT,[1001]:J.CLAMP_TO_EDGE,[1002]:J.MIRRORED_REPEAT},e={[1003]:J.NEAREST,[1004]:J.NEAREST_MIPMAP_NEAREST,[1005]:J.NEAREST_MIPMAP_LINEAR,[1006]:J.LINEAR,[1007]:J.LINEAR_MIPMAP_NEAREST,[1008]:J.LINEAR_MIPMAP_LINEAR},x={[512]:J.NEVER,[519]:J.ALWAYS,[513]:J.LESS,[515]:J.LEQUAL,[514]:J.EQUAL,[518]:J.GEQUAL,[516]:J.GREATER,[517]:J.NOTEQUAL};function s(C,M,h){if(h){if(J.texParameteri(C,J.TEXTURE_WRAP_S,t[M.wrapS]),J.texParameteri(C,J.TEXTURE_WRAP_T,t[M.wrapT]),C===J.TEXTURE_3D||C===J.TEXTURE_2D_ARRAY)J.texParameteri(C,J.TEXTURE_WRAP_R,t[M.wrapR]);J.texParameteri(C,J.TEXTURE_MAG_FILTER,e[M.magFilter]),J.texParameteri(C,J.TEXTURE_MIN_FILTER,e[M.minFilter])}else{if(J.texParameteri(C,J.TEXTURE_WRAP_S,J.CLAMP_TO_EDGE),J.texParameteri(C,J.TEXTURE_WRAP_T,J.CLAMP_TO_EDGE),C===J.TEXTURE_3D||C===J.TEXTURE_2D_ARRAY)J.texParameteri(C,J.TEXTURE_WRAP_R,J.CLAMP_TO_EDGE);if(M.wrapS!==1001||M.wrapT!==1001)console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.");if(J.texParameteri(C,J.TEXTURE_MAG_FILTER,L(M.magFilter)),J.texParameteri(C,J.TEXTURE_MIN_FILTER,L(M.minFilter)),M.minFilter!==1003&&M.minFilter!==1006)console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")}if(M.compareFunction)J.texParameteri(C,J.TEXTURE_COMPARE_MODE,J.COMPARE_REF_TO_TEXTURE),J.texParameteri(C,J.TEXTURE_COMPARE_FUNC,x[M.compareFunction]);if($.has("EXT_texture_filter_anisotropic")===!0){let r=$.get("EXT_texture_filter_anisotropic");if(M.magFilter===1003)return;if(M.minFilter!==1005&&M.minFilter!==1008)return;if(M.type===1015&&$.has("OES_texture_float_linear")===!1)return;if(Y===!1&&(M.type===1016&&$.has("OES_texture_half_float_linear")===!1))return;if(M.anisotropy>1||Q.get(M).__currentAnisotropy)J.texParameterf(C,r.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,W.getMaxAnisotropy())),Q.get(M).__currentAnisotropy=M.anisotropy}}function YJ(C,M){let h=!1;if(C.__webglInit===void 0)C.__webglInit=!0,M.addEventListener("dispose",S);let r=M.source,n=V.get(r);if(n===void 0)n={},V.set(r,n);let o=l(M);if(o!==C.__cacheKey){if(n[o]===void 0)n[o]={texture:J.createTexture(),usedTimes:0},H.memory.textures++,h=!0;n[o].usedTimes++;let _J=n[C.__cacheKey];if(_J!==void 0){if(n[C.__cacheKey].usedTimes--,_J.usedTimes===0)I(M)}C.__cacheKey=o,C.__webglTexture=n[o].texture}return h}function HJ(C,M,h){let r=J.TEXTURE_2D;if(M.isDataArrayTexture||M.isCompressedArrayTexture)r=J.TEXTURE_2D_ARRAY;if(M.isData3DTexture)r=J.TEXTURE_3D;let n=YJ(C,M),o=M.source;Z.bindTexture(r,C.__webglTexture,J.TEXTURE0+h);let _J=Q.get(o);if(o.version!==_J.__version||n===!0){Z.activeTexture(J.TEXTURE0+h);let WJ=iJ.getPrimaries(iJ.workingColorSpace),UJ=M.colorSpace===""?null:iJ.getPrimaries(M.colorSpace),FJ=M.colorSpace===""||WJ===UJ?J.NONE:J.BROWSER_DEFAULT_WEBGL;J.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,M.flipY),J.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),J.pixelStorei(J.UNPACK_ALIGNMENT,M.unpackAlignment),J.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,FJ);let SJ=G(M)&&F(M.image)===!1,i=R(M.image,SJ,!1,W.maxTextureSize);i=xJ(M,i);let U7=F(i)||Y,gJ=X.convert(M.format,M.colorSpace),IJ=X.convert(M.type),KJ=w(M.internalFormat,gJ,IJ,M.colorSpace,M.isVideoTexture);s(r,M,U7);let EJ,pJ=M.mipmaps,rJ=Y&&M.isVideoTexture!==!0&&KJ!==36196,cJ=_J.__version===void 0||n===!0,tJ=k(M,i,U7);if(M.isDepthTexture){if(KJ=J.DEPTH_COMPONENT,Y)if(M.type===1015)KJ=J.DEPTH_COMPONENT32F;else if(M.type===1014)KJ=J.DEPTH_COMPONENT24;else if(M.type===1020)KJ=J.DEPTH24_STENCIL8;else KJ=J.DEPTH_COMPONENT16;else if(M.type===1015)console.error("WebGLRenderer: Floating point depth texture requires WebGL2.");if(M.format===1026&&KJ===J.DEPTH_COMPONENT){if(M.type!==1012&&M.type!==1014)console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=1014,IJ=X.convert(M.type)}if(M.format===1027&&KJ===J.DEPTH_COMPONENT){if(KJ=J.DEPTH_STENCIL,M.type!==1020)console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=1020,IJ=X.convert(M.type)}if(cJ)if(rJ)Z.texStorage2D(J.TEXTURE_2D,1,KJ,i.width,i.height);else Z.texImage2D(J.TEXTURE_2D,0,KJ,i.width,i.height,0,gJ,IJ,null)}else if(M.isDataTexture)if(pJ.length>0&&U7){if(rJ&&cJ)Z.texStorage2D(J.TEXTURE_2D,tJ,KJ,pJ[0].width,pJ[0].height);for(let JJ=0,P=pJ.length;JJ<P;JJ++)if(EJ=pJ[JJ],rJ)Z.texSubImage2D(J.TEXTURE_2D,JJ,0,0,EJ.width,EJ.height,gJ,IJ,EJ.data);else Z.texImage2D(J.TEXTURE_2D,JJ,KJ,EJ.width,EJ.height,0,gJ,IJ,EJ.data);M.generateMipmaps=!1}else if(rJ){if(cJ)Z.texStorage2D(J.TEXTURE_2D,tJ,KJ,i.width,i.height);Z.texSubImage2D(J.TEXTURE_2D,0,0,0,i.width,i.height,gJ,IJ,i.data)}else Z.texImage2D(J.TEXTURE_2D,0,KJ,i.width,i.height,0,gJ,IJ,i.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){if(rJ&&cJ)Z.texStorage3D(J.TEXTURE_2D_ARRAY,tJ,KJ,pJ[0].width,pJ[0].height,i.depth);for(let JJ=0,P=pJ.length;JJ<P;JJ++)if(EJ=pJ[JJ],M.format!==1023)if(gJ!==null)if(rJ)Z.compressedTexSubImage3D(J.TEXTURE_2D_ARRAY,JJ,0,0,0,EJ.width,EJ.height,i.depth,gJ,EJ.data,0,0);else Z.compressedTexImage3D(J.TEXTURE_2D_ARRAY,JJ,KJ,EJ.width,EJ.height,i.depth,0,EJ.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(rJ)Z.texSubImage3D(J.TEXTURE_2D_ARRAY,JJ,0,0,0,EJ.width,EJ.height,i.depth,gJ,IJ,EJ.data);else Z.texImage3D(J.TEXTURE_2D_ARRAY,JJ,KJ,EJ.width,EJ.height,i.depth,0,gJ,IJ,EJ.data)}else{if(rJ&&cJ)Z.texStorage2D(J.TEXTURE_2D,tJ,KJ,pJ[0].width,pJ[0].height);for(let JJ=0,P=pJ.length;JJ<P;JJ++)if(EJ=pJ[JJ],M.format!==1023)if(gJ!==null)if(rJ)Z.compressedTexSubImage2D(J.TEXTURE_2D,JJ,0,0,EJ.width,EJ.height,gJ,EJ.data);else Z.compressedTexImage2D(J.TEXTURE_2D,JJ,KJ,EJ.width,EJ.height,0,EJ.data);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(rJ)Z.texSubImage2D(J.TEXTURE_2D,JJ,0,0,EJ.width,EJ.height,gJ,IJ,EJ.data);else Z.texImage2D(J.TEXTURE_2D,JJ,KJ,EJ.width,EJ.height,0,gJ,IJ,EJ.data)}else if(M.isDataArrayTexture)if(rJ){if(cJ)Z.texStorage3D(J.TEXTURE_2D_ARRAY,tJ,KJ,i.width,i.height,i.depth);Z.texSubImage3D(J.TEXTURE_2D_ARRAY,0,0,0,0,i.width,i.height,i.depth,gJ,IJ,i.data)}else Z.texImage3D(J.TEXTURE_2D_ARRAY,0,KJ,i.width,i.height,i.depth,0,gJ,IJ,i.data);else if(M.isData3DTexture)if(rJ){if(cJ)Z.texStorage3D(J.TEXTURE_3D,tJ,KJ,i.width,i.height,i.depth);Z.texSubImage3D(J.TEXTURE_3D,0,0,0,0,i.width,i.height,i.depth,gJ,IJ,i.data)}else Z.texImage3D(J.TEXTURE_3D,0,KJ,i.width,i.height,i.depth,0,gJ,IJ,i.data);else if(M.isFramebufferTexture){if(cJ)if(rJ)Z.texStorage2D(J.TEXTURE_2D,tJ,KJ,i.width,i.height);else{let{width:JJ,height:P}=i;for(let QJ=0;QJ<tJ;QJ++)Z.texImage2D(J.TEXTURE_2D,QJ,KJ,JJ,P,0,gJ,IJ,null),JJ>>=1,P>>=1}}else if(pJ.length>0&&U7){if(rJ&&cJ)Z.texStorage2D(J.TEXTURE_2D,tJ,KJ,pJ[0].width,pJ[0].height);for(let JJ=0,P=pJ.length;JJ<P;JJ++)if(EJ=pJ[JJ],rJ)Z.texSubImage2D(J.TEXTURE_2D,JJ,0,0,gJ,IJ,EJ);else Z.texImage2D(J.TEXTURE_2D,JJ,KJ,gJ,IJ,EJ);M.generateMipmaps=!1}else if(rJ){if(cJ)Z.texStorage2D(J.TEXTURE_2D,tJ,KJ,i.width,i.height);Z.texSubImage2D(J.TEXTURE_2D,0,0,0,gJ,IJ,i)}else Z.texImage2D(J.TEXTURE_2D,0,KJ,gJ,IJ,i);if(N(M,U7))z(r);if(_J.__version=o.version,M.onUpdate)M.onUpdate(M)}C.__version=M.version}function MJ(C,M,h){if(M.image.length!==6)return;let r=YJ(C,M),n=M.source;Z.bindTexture(J.TEXTURE_CUBE_MAP,C.__webglTexture,J.TEXTURE0+h);let o=Q.get(n);if(n.version!==o.__version||r===!0){Z.activeTexture(J.TEXTURE0+h);let _J=iJ.getPrimaries(iJ.workingColorSpace),WJ=M.colorSpace===""?null:iJ.getPrimaries(M.colorSpace),UJ=M.colorSpace===""||_J===WJ?J.NONE:J.BROWSER_DEFAULT_WEBGL;J.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,M.flipY),J.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),J.pixelStorei(J.UNPACK_ALIGNMENT,M.unpackAlignment),J.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,UJ);let FJ=M.isCompressedTexture||M.image[0].isCompressedTexture,SJ=M.image[0]&&M.image[0].isDataTexture,i=[];for(let JJ=0;JJ<6;JJ++){if(!FJ&&!SJ)i[JJ]=R(M.image[JJ],!1,!0,W.maxCubemapSize);else i[JJ]=SJ?M.image[JJ].image:M.image[JJ];i[JJ]=xJ(M,i[JJ])}let U7=i[0],gJ=F(U7)||Y,IJ=X.convert(M.format,M.colorSpace),KJ=X.convert(M.type),EJ=w(M.internalFormat,IJ,KJ,M.colorSpace),pJ=Y&&M.isVideoTexture!==!0,rJ=o.__version===void 0||r===!0,cJ=k(M,U7,gJ);s(J.TEXTURE_CUBE_MAP,M,gJ);let tJ;if(FJ){if(pJ&&rJ)Z.texStorage2D(J.TEXTURE_CUBE_MAP,cJ,EJ,U7.width,U7.height);for(let JJ=0;JJ<6;JJ++){tJ=i[JJ].mipmaps;for(let P=0;P<tJ.length;P++){let QJ=tJ[P];if(M.format!==1023)if(IJ!==null)if(pJ)Z.compressedTexSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P,0,0,QJ.width,QJ.height,IJ,QJ.data);else Z.compressedTexImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P,EJ,QJ.width,QJ.height,0,QJ.data);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(pJ)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P,0,0,QJ.width,QJ.height,IJ,KJ,QJ.data);else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P,EJ,QJ.width,QJ.height,0,IJ,KJ,QJ.data)}}}else{if(tJ=M.mipmaps,pJ&&rJ){if(tJ.length>0)cJ++;Z.texStorage2D(J.TEXTURE_CUBE_MAP,cJ,EJ,i[0].width,i[0].height)}for(let JJ=0;JJ<6;JJ++)if(SJ){if(pJ)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,0,0,0,i[JJ].width,i[JJ].height,IJ,KJ,i[JJ].data);else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,0,EJ,i[JJ].width,i[JJ].height,0,IJ,KJ,i[JJ].data);for(let P=0;P<tJ.length;P++){let XJ=tJ[P].image[JJ].image;if(pJ)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P+1,0,0,XJ.width,XJ.height,IJ,KJ,XJ.data);else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P+1,EJ,XJ.width,XJ.height,0,IJ,KJ,XJ.data)}}else{if(pJ)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,0,0,0,IJ,KJ,i[JJ]);else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,0,EJ,IJ,KJ,i[JJ]);for(let P=0;P<tJ.length;P++){let QJ=tJ[P];if(pJ)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P+1,0,0,IJ,KJ,QJ.image[JJ]);else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,P+1,EJ,IJ,KJ,QJ.image[JJ])}}}if(N(M,gJ))z(J.TEXTURE_CUBE_MAP);if(o.__version=n.version,M.onUpdate)M.onUpdate(M)}C.__version=M.version}function LJ(C,M,h,r,n,o){let _J=X.convert(h.format,h.colorSpace),WJ=X.convert(h.type),UJ=w(h.internalFormat,_J,WJ,h.colorSpace);if(!Q.get(M).__hasExternalTextures){let SJ=Math.max(1,M.width>>o),i=Math.max(1,M.height>>o);if(n===J.TEXTURE_3D||n===J.TEXTURE_2D_ARRAY)Z.texImage3D(n,o,UJ,SJ,i,M.depth,0,_J,WJ,null);else Z.texImage2D(n,o,UJ,SJ,i,0,_J,WJ,null)}if(Z.bindFramebuffer(J.FRAMEBUFFER,C),TJ(M))q.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,r,n,Q.get(h).__webglTexture,0,zJ(M));else if(n===J.TEXTURE_2D||n>=J.TEXTURE_CUBE_MAP_POSITIVE_X&&n<=J.TEXTURE_CUBE_MAP_NEGATIVE_Z)J.framebufferTexture2D(J.FRAMEBUFFER,r,n,Q.get(h).__webglTexture,o);Z.bindFramebuffer(J.FRAMEBUFFER,null)}function bJ(C,M,h){if(J.bindRenderbuffer(J.RENDERBUFFER,C),M.depthBuffer&&!M.stencilBuffer){let r=Y===!0?J.DEPTH_COMPONENT24:J.DEPTH_COMPONENT16;if(h||TJ(M)){let n=M.depthTexture;if(n&&n.isDepthTexture){if(n.type===1015)r=J.DEPTH_COMPONENT32F;else if(n.type===1014)r=J.DEPTH_COMPONENT24}let o=zJ(M);if(TJ(M))q.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,o,r,M.width,M.height);else J.renderbufferStorageMultisample(J.RENDERBUFFER,o,r,M.width,M.height)}else J.renderbufferStorage(J.RENDERBUFFER,r,M.width,M.height);J.framebufferRenderbuffer(J.FRAMEBUFFER,J.DEPTH_ATTACHMENT,J.RENDERBUFFER,C)}else if(M.depthBuffer&&M.stencilBuffer){let r=zJ(M);if(h&&TJ(M)===!1)J.renderbufferStorageMultisample(J.RENDERBUFFER,r,J.DEPTH24_STENCIL8,M.width,M.height);else if(TJ(M))q.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,r,J.DEPTH24_STENCIL8,M.width,M.height);else J.renderbufferStorage(J.RENDERBUFFER,J.DEPTH_STENCIL,M.width,M.height);J.framebufferRenderbuffer(J.FRAMEBUFFER,J.DEPTH_STENCIL_ATTACHMENT,J.RENDERBUFFER,C)}else{let r=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let n=0;n<r.length;n++){let o=r[n],_J=X.convert(o.format,o.colorSpace),WJ=X.convert(o.type),UJ=w(o.internalFormat,_J,WJ,o.colorSpace),FJ=zJ(M);if(h&&TJ(M)===!1)J.renderbufferStorageMultisample(J.RENDERBUFFER,FJ,UJ,M.width,M.height);else if(TJ(M))q.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,FJ,UJ,M.width,M.height);else J.renderbufferStorage(J.RENDERBUFFER,UJ,M.width,M.height)}}J.bindRenderbuffer(J.RENDERBUFFER,null)}function CJ(C,M){if(M&&M.isWebGLCubeRenderTarget)throw Error("Depth Texture with cube render targets is not supported");if(Z.bindFramebuffer(J.FRAMEBUFFER,C),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");if(!Q.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0;m(M.depthTexture,0);let r=Q.get(M.depthTexture).__webglTexture,n=zJ(M);if(M.depthTexture.format===1026)if(TJ(M))q.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,J.DEPTH_ATTACHMENT,J.TEXTURE_2D,r,0,n);else J.framebufferTexture2D(J.FRAMEBUFFER,J.DEPTH_ATTACHMENT,J.TEXTURE_2D,r,0);else if(M.depthTexture.format===1027)if(TJ(M))q.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,J.DEPTH_STENCIL_ATTACHMENT,J.TEXTURE_2D,r,0,n);else J.framebufferTexture2D(J.FRAMEBUFFER,J.DEPTH_STENCIL_ATTACHMENT,J.TEXTURE_2D,r,0);else throw Error("Unknown depthTexture format")}function oJ(C){let M=Q.get(C),h=C.isWebGLCubeRenderTarget===!0;if(C.depthTexture&&!M.__autoAllocateDepthBuffer){if(h)throw Error("target.depthTexture not supported in Cube render targets");CJ(M.__webglFramebuffer,C)}else if(h){M.__webglDepthbuffer=[];for(let r=0;r<6;r++)Z.bindFramebuffer(J.FRAMEBUFFER,M.__webglFramebuffer[r]),M.__webglDepthbuffer[r]=J.createRenderbuffer(),bJ(M.__webglDepthbuffer[r],C,!1)}else Z.bindFramebuffer(J.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=J.createRenderbuffer(),bJ(M.__webglDepthbuffer,C,!1);Z.bindFramebuffer(J.FRAMEBUFFER,null)}function v(C,M,h){let r=Q.get(C);if(M!==void 0)LJ(r.__webglFramebuffer,C,C.texture,J.COLOR_ATTACHMENT0,J.TEXTURE_2D,0);if(h!==void 0)oJ(C)}function w7(C){let M=C.texture,h=Q.get(C),r=Q.get(M);if(C.addEventListener("dispose",g),C.isWebGLMultipleRenderTargets!==!0){if(r.__webglTexture===void 0)r.__webglTexture=J.createTexture();r.__version=M.version,H.memory.textures++}let n=C.isWebGLCubeRenderTarget===!0,o=C.isWebGLMultipleRenderTargets===!0,_J=F(C)||Y;if(n){h.__webglFramebuffer=[];for(let WJ=0;WJ<6;WJ++)if(Y&&M.mipmaps&&M.mipmaps.length>0){h.__webglFramebuffer[WJ]=[];for(let UJ=0;UJ<M.mipmaps.length;UJ++)h.__webglFramebuffer[WJ][UJ]=J.createFramebuffer()}else h.__webglFramebuffer[WJ]=J.createFramebuffer()}else{if(Y&&M.mipmaps&&M.mipmaps.length>0){h.__webglFramebuffer=[];for(let WJ=0;WJ<M.mipmaps.length;WJ++)h.__webglFramebuffer[WJ]=J.createFramebuffer()}else h.__webglFramebuffer=J.createFramebuffer();if(o)if(W.drawBuffers){let WJ=C.texture;for(let UJ=0,FJ=WJ.length;UJ<FJ;UJ++){let SJ=Q.get(WJ[UJ]);if(SJ.__webglTexture===void 0)SJ.__webglTexture=J.createTexture(),H.memory.textures++}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(Y&&C.samples>0&&TJ(C)===!1){let WJ=o?M:[M];h.__webglMultisampledFramebuffer=J.createFramebuffer(),h.__webglColorRenderbuffer=[],Z.bindFramebuffer(J.FRAMEBUFFER,h.__webglMultisampledFramebuffer);for(let UJ=0;UJ<WJ.length;UJ++){let FJ=WJ[UJ];h.__webglColorRenderbuffer[UJ]=J.createRenderbuffer(),J.bindRenderbuffer(J.RENDERBUFFER,h.__webglColorRenderbuffer[UJ]);let SJ=X.convert(FJ.format,FJ.colorSpace),i=X.convert(FJ.type),U7=w(FJ.internalFormat,SJ,i,FJ.colorSpace,C.isXRRenderTarget===!0),gJ=zJ(C);J.renderbufferStorageMultisample(J.RENDERBUFFER,gJ,U7,C.width,C.height),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+UJ,J.RENDERBUFFER,h.__webglColorRenderbuffer[UJ])}if(J.bindRenderbuffer(J.RENDERBUFFER,null),C.depthBuffer)h.__webglDepthRenderbuffer=J.createRenderbuffer(),bJ(h.__webglDepthRenderbuffer,C,!0);Z.bindFramebuffer(J.FRAMEBUFFER,null)}}if(n){Z.bindTexture(J.TEXTURE_CUBE_MAP,r.__webglTexture),s(J.TEXTURE_CUBE_MAP,M,_J);for(let WJ=0;WJ<6;WJ++)if(Y&&M.mipmaps&&M.mipmaps.length>0)for(let UJ=0;UJ<M.mipmaps.length;UJ++)LJ(h.__webglFramebuffer[WJ][UJ],C,M,J.COLOR_ATTACHMENT0,J.TEXTURE_CUBE_MAP_POSITIVE_X+WJ,UJ);else LJ(h.__webglFramebuffer[WJ],C,M,J.COLOR_ATTACHMENT0,J.TEXTURE_CUBE_MAP_POSITIVE_X+WJ,0);if(N(M,_J))z(J.TEXTURE_CUBE_MAP);Z.unbindTexture()}else if(o){let WJ=C.texture;for(let UJ=0,FJ=WJ.length;UJ<FJ;UJ++){let SJ=WJ[UJ],i=Q.get(SJ);if(Z.bindTexture(J.TEXTURE_2D,i.__webglTexture),s(J.TEXTURE_2D,SJ,_J),LJ(h.__webglFramebuffer,C,SJ,J.COLOR_ATTACHMENT0+UJ,J.TEXTURE_2D,0),N(SJ,_J))z(J.TEXTURE_2D)}Z.unbindTexture()}else{let WJ=J.TEXTURE_2D;if(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)if(Y)WJ=C.isWebGL3DRenderTarget?J.TEXTURE_3D:J.TEXTURE_2D_ARRAY;else console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.");if(Z.bindTexture(WJ,r.__webglTexture),s(WJ,M,_J),Y&&M.mipmaps&&M.mipmaps.length>0)for(let UJ=0;UJ<M.mipmaps.length;UJ++)LJ(h.__webglFramebuffer[UJ],C,M,J.COLOR_ATTACHMENT0,WJ,UJ);else LJ(h.__webglFramebuffer,C,M,J.COLOR_ATTACHMENT0,WJ,0);if(N(M,_J))z(WJ);Z.unbindTexture()}if(C.depthBuffer)oJ(C)}function dJ(C){let M=F(C)||Y,h=C.isWebGLMultipleRenderTargets===!0?C.texture:[C.texture];for(let r=0,n=h.length;r<n;r++){let o=h[r];if(N(o,M)){let _J=C.isWebGLCubeRenderTarget?J.TEXTURE_CUBE_MAP:J.TEXTURE_2D,WJ=Q.get(o).__webglTexture;Z.bindTexture(_J,WJ),z(_J),Z.unbindTexture()}}}function OJ(C){if(Y&&C.samples>0&&TJ(C)===!1){let M=C.isWebGLMultipleRenderTargets?C.texture:[C.texture],h=C.width,r=C.height,n=J.COLOR_BUFFER_BIT,o=[],_J=C.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,WJ=Q.get(C),UJ=C.isWebGLMultipleRenderTargets===!0;if(UJ)for(let FJ=0;FJ<M.length;FJ++)Z.bindFramebuffer(J.FRAMEBUFFER,WJ.__webglMultisampledFramebuffer),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+FJ,J.RENDERBUFFER,null),Z.bindFramebuffer(J.FRAMEBUFFER,WJ.__webglFramebuffer),J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0+FJ,J.TEXTURE_2D,null,0);Z.bindFramebuffer(J.READ_FRAMEBUFFER,WJ.__webglMultisampledFramebuffer),Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,WJ.__webglFramebuffer);for(let FJ=0;FJ<M.length;FJ++){if(o.push(J.COLOR_ATTACHMENT0+FJ),C.depthBuffer)o.push(_J);let SJ=WJ.__ignoreDepthValues!==void 0?WJ.__ignoreDepthValues:!1;if(SJ===!1){if(C.depthBuffer)n|=J.DEPTH_BUFFER_BIT;if(C.stencilBuffer)n|=J.STENCIL_BUFFER_BIT}if(UJ)J.framebufferRenderbuffer(J.READ_FRAMEBUFFER,J.COLOR_ATTACHMENT0,J.RENDERBUFFER,WJ.__webglColorRenderbuffer[FJ]);if(SJ===!0)J.invalidateFramebuffer(J.READ_FRAMEBUFFER,[_J]),J.invalidateFramebuffer(J.DRAW_FRAMEBUFFER,[_J]);if(UJ){let i=Q.get(M[FJ]).__webglTexture;J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0,J.TEXTURE_2D,i,0)}if(J.blitFramebuffer(0,0,h,r,0,0,h,r,n,J.NEAREST),U)J.invalidateFramebuffer(J.READ_FRAMEBUFFER,o)}if(Z.bindFramebuffer(J.READ_FRAMEBUFFER,null),Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,null),UJ)for(let FJ=0;FJ<M.length;FJ++){Z.bindFramebuffer(J.FRAMEBUFFER,WJ.__webglMultisampledFramebuffer),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+FJ,J.RENDERBUFFER,WJ.__webglColorRenderbuffer[FJ]);let SJ=Q.get(M[FJ]).__webglTexture;Z.bindFramebuffer(J.FRAMEBUFFER,WJ.__webglFramebuffer),J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0+FJ,J.TEXTURE_2D,SJ,0)}Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,WJ.__webglMultisampledFramebuffer)}}function zJ(C){return Math.min(W.maxSamples,C.samples)}function TJ(C){let M=Q.get(C);return Y&&C.samples>0&&$.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function uJ(C){let M=H.render.frame;if(K.get(C)!==M)K.set(C,M),C.update()}function xJ(C,M){let{colorSpace:h,format:r,type:n}=C;if(C.isCompressedTexture===!0||C.isVideoTexture===!0||C.format===1035)return M;if(h!=="srgb-linear"&&h!=="")if(iJ.getTransfer(h)==="srgb"){if(Y===!1)if($.has("EXT_sRGB")===!0&&r===1023)C.format=1035,C.minFilter=1006,C.generateMipmaps=!1;else M=x8.sRGBToLinear(M);else if(r!==1023||n!==1009)console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else console.error("THREE.WebGLTextures: Unsupported texture color space:",h);return M}this.allocateTextureUnit=A,this.resetTextureUnits=ZJ,this.setTexture2D=m,this.setTexture2DArray=a,this.setTexture3D=d,this.setTextureCube=u,this.rebindTextures=v,this.setupRenderTarget=w7,this.updateRenderTargetMipmap=dJ,this.updateMultisampleRenderTarget=OJ,this.setupDepthRenderbuffer=oJ,this.setupFrameBufferTexture=LJ,this.useMultisampledRTT=TJ}function hH(J,$,Z){let Q=Z.isWebGL2;function W(X,H=""){let Y,q=iJ.getTransfer(H);if(X===1009)return J.UNSIGNED_BYTE;if(X===1017)return J.UNSIGNED_SHORT_4_4_4_4;if(X===1018)return J.UNSIGNED_SHORT_5_5_5_1;if(X===1010)return J.BYTE;if(X===1011)return J.SHORT;if(X===1012)return J.UNSIGNED_SHORT;if(X===1013)return J.INT;if(X===1014)return J.UNSIGNED_INT;if(X===1015)return J.FLOAT;if(X===1016){if(Q)return J.HALF_FLOAT;if(Y=$.get("OES_texture_half_float"),Y!==null)return Y.HALF_FLOAT_OES;else return null}if(X===1021)return J.ALPHA;if(X===1023)return J.RGBA;if(X===1024)return J.LUMINANCE;if(X===1025)return J.LUMINANCE_ALPHA;if(X===1026)return J.DEPTH_COMPONENT;if(X===1027)return J.DEPTH_STENCIL;if(X===1035)if(Y=$.get("EXT_sRGB"),Y!==null)return Y.SRGB_ALPHA_EXT;else return null;if(X===1028)return J.RED;if(X===1029)return J.RED_INTEGER;if(X===1030)return J.RG;if(X===1031)return J.RG_INTEGER;if(X===1033)return J.RGBA_INTEGER;if(X===33776||X===33777||X===33778||X===33779)if(q==="srgb")if(Y=$.get("WEBGL_compressed_texture_s3tc_srgb"),Y!==null){if(X===33776)return Y.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(X===33777)return Y.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(X===33778)return Y.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(X===33779)return Y.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(Y=$.get("WEBGL_compressed_texture_s3tc"),Y!==null){if(X===33776)return Y.COMPRESSED_RGB_S3TC_DXT1_EXT;if(X===33777)return Y.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(X===33778)return Y.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(X===33779)return Y.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(X===35840||X===35841||X===35842||X===35843)if(Y=$.get("WEBGL_compressed_texture_pvrtc"),Y!==null){if(X===35840)return Y.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(X===35841)return Y.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(X===35842)return Y.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(X===35843)return Y.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(X===36196)if(Y=$.get("WEBGL_compressed_texture_etc1"),Y!==null)return Y.COMPRESSED_RGB_ETC1_WEBGL;else return null;if(X===37492||X===37496)if(Y=$.get("WEBGL_compressed_texture_etc"),Y!==null){if(X===37492)return q==="srgb"?Y.COMPRESSED_SRGB8_ETC2:Y.COMPRESSED_RGB8_ETC2;if(X===37496)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:Y.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(X===37808||X===37809||X===37810||X===37811||X===37812||X===37813||X===37814||X===37815||X===37816||X===37817||X===37818||X===37819||X===37820||X===37821)if(Y=$.get("WEBGL_compressed_texture_astc"),Y!==null){if(X===37808)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:Y.COMPRESSED_RGBA_ASTC_4x4_KHR;if(X===37809)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:Y.COMPRESSED_RGBA_ASTC_5x4_KHR;if(X===37810)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:Y.COMPRESSED_RGBA_ASTC_5x5_KHR;if(X===37811)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:Y.COMPRESSED_RGBA_ASTC_6x5_KHR;if(X===37812)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:Y.COMPRESSED_RGBA_ASTC_6x6_KHR;if(X===37813)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:Y.COMPRESSED_RGBA_ASTC_8x5_KHR;if(X===37814)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:Y.COMPRESSED_RGBA_ASTC_8x6_KHR;if(X===37815)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:Y.COMPRESSED_RGBA_ASTC_8x8_KHR;if(X===37816)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:Y.COMPRESSED_RGBA_ASTC_10x5_KHR;if(X===37817)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:Y.COMPRESSED_RGBA_ASTC_10x6_KHR;if(X===37818)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:Y.COMPRESSED_RGBA_ASTC_10x8_KHR;if(X===37819)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:Y.COMPRESSED_RGBA_ASTC_10x10_KHR;if(X===37820)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:Y.COMPRESSED_RGBA_ASTC_12x10_KHR;if(X===37821)return q==="srgb"?Y.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:Y.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(X===36492||X===36494||X===36495)if(Y=$.get("EXT_texture_compression_bptc"),Y!==null){if(X===36492)return q==="srgb"?Y.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:Y.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(X===36494)return Y.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(X===36495)return Y.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(X===36283||X===36284||X===36285||X===36286)if(Y=$.get("EXT_texture_compression_rgtc"),Y!==null){if(X===36492)return Y.COMPRESSED_RED_RGTC1_EXT;if(X===36284)return Y.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(X===36285)return Y.COMPRESSED_RED_GREEN_RGTC2_EXT;if(X===36286)return Y.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if(X===1020){if(Q)return J.UNSIGNED_INT_24_8;if(Y=$.get("WEBGL_depth_texture"),Y!==null)return Y.UNSIGNED_INT_24_8_WEBGL;else return null}return J[X]!==void 0?J[X]:null}return{convert:W}}class R5 extends M7{constructor(J=[]){super();this.isArrayCamera=!0,this.cameras=J}}class T7 extends $7{constructor(){super();this.isGroup=!0,this.type="Group"}}var bH={type:"move"};class P0{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new T7,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new T7,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new T,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new T;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new T7,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new T,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new T;return this._grip}dispatchEvent(J){if(this._targetRay!==null)this._targetRay.dispatchEvent(J);if(this._grip!==null)this._grip.dispatchEvent(J);if(this._hand!==null)this._hand.dispatchEvent(J);return this}connect(J){if(J&&J.hand){let $=this._hand;if($)for(let Z of J.hand.values())this._getHandJoint($,Z)}return this.dispatchEvent({type:"connected",data:J}),this}disconnect(J){if(this.dispatchEvent({type:"disconnected",data:J}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(J,$,Z){let Q=null,W=null,X=null,H=this._targetRay,Y=this._grip,q=this._hand;if(J&&$.session.visibilityState!=="visible-blurred"){if(q&&J.hand){X=!0;for(let _ of J.hand.values()){let R=$.getJointPose(_,Z),F=this._getHandJoint(q,_);if(R!==null)F.matrix.fromArray(R.transform.matrix),F.matrix.decompose(F.position,F.rotation,F.scale),F.matrixWorldNeedsUpdate=!0,F.jointRadius=R.radius;F.visible=R!==null}let U=q.joints["index-finger-tip"],K=q.joints["thumb-tip"],E=U.position.distanceTo(K.position),V=0.02,O=0.005;if(q.inputState.pinching&&E>V+O)q.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:J.handedness,target:this});else if(!q.inputState.pinching&&E<=V-O)q.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:J.handedness,target:this})}else if(Y!==null&&J.gripSpace){if(W=$.getPose(J.gripSpace,Z),W!==null){if(Y.matrix.fromArray(W.transform.matrix),Y.matrix.decompose(Y.position,Y.rotation,Y.scale),Y.matrixWorldNeedsUpdate=!0,W.linearVelocity)Y.hasLinearVelocity=!0,Y.linearVelocity.copy(W.linearVelocity);else Y.hasLinearVelocity=!1;if(W.angularVelocity)Y.hasAngularVelocity=!0,Y.angularVelocity.copy(W.angularVelocity);else Y.hasAngularVelocity=!1}}if(H!==null){if(Q=$.getPose(J.targetRaySpace,Z),Q===null&&W!==null)Q=W;if(Q!==null){if(H.matrix.fromArray(Q.transform.matrix),H.matrix.decompose(H.position,H.rotation,H.scale),H.matrixWorldNeedsUpdate=!0,Q.linearVelocity)H.hasLinearVelocity=!0,H.linearVelocity.copy(Q.linearVelocity);else H.hasLinearVelocity=!1;if(Q.angularVelocity)H.hasAngularVelocity=!0,H.angularVelocity.copy(Q.angularVelocity);else H.hasAngularVelocity=!1;this.dispatchEvent(bH)}}}if(H!==null)H.visible=Q!==null;if(Y!==null)Y.visible=W!==null;if(q!==null)q.visible=X!==null;return this}_getHandJoint(J,$){if(J.joints[$.jointName]===void 0){let Z=new T7;Z.matrixAutoUpdate=!1,Z.visible=!1,J.joints[$.jointName]=Z,J.add(Z)}return J.joints[$.jointName]}}class _5 extends M9{constructor(J,$){super();let Z=this,Q=null,W=1,X=null,H="local-floor",Y=1,q=null,U=null,K=null,E=null,V=null,O=null,_=$.getContextAttributes(),R=null,F=null,G=[],N=[],z=new yJ,w=null,k=new M7;k.layers.enable(1),k.viewport=new J7;let L=new M7;L.layers.enable(2),L.viewport=new J7;let S=[k,L],g=new R5;g.layers.enable(1),g.layers.enable(2);let B=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(x){let s=G[x];if(s===void 0)s=new P0,G[x]=s;return s.getTargetRaySpace()},this.getControllerGrip=function(x){let s=G[x];if(s===void 0)s=new P0,G[x]=s;return s.getGripSpace()},this.getHand=function(x){let s=G[x];if(s===void 0)s=new P0,G[x]=s;return s.getHandSpace()};function y(x){let s=N.indexOf(x.inputSource);if(s===-1)return;let YJ=G[s];if(YJ!==void 0)YJ.update(x.inputSource,x.frame,q||X),YJ.dispatchEvent({type:x.type,data:x.inputSource})}function c(){Q.removeEventListener("select",y),Q.removeEventListener("selectstart",y),Q.removeEventListener("selectend",y),Q.removeEventListener("squeeze",y),Q.removeEventListener("squeezestart",y),Q.removeEventListener("squeezeend",y),Q.removeEventListener("end",c),Q.removeEventListener("inputsourceschange",ZJ);for(let x=0;x<G.length;x++){let s=N[x];if(s===null)continue;N[x]=null,G[x].disconnect(s)}B=null,I=null,J.setRenderTarget(R),V=null,E=null,K=null,Q=null,F=null,e.stop(),Z.isPresenting=!1,J.setPixelRatio(w),J.setSize(z.width,z.height,!1),Z.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(x){if(W=x,Z.isPresenting===!0)console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(x){if(H=x,Z.isPresenting===!0)console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return q||X},this.setReferenceSpace=function(x){q=x},this.getBaseLayer=function(){return E!==null?E:V},this.getBinding=function(){return K},this.getFrame=function(){return O},this.getSession=function(){return Q},this.setSession=async function(x){if(Q=x,Q!==null){if(R=J.getRenderTarget(),Q.addEventListener("select",y),Q.addEventListener("selectstart",y),Q.addEventListener("selectend",y),Q.addEventListener("squeeze",y),Q.addEventListener("squeezestart",y),Q.addEventListener("squeezeend",y),Q.addEventListener("end",c),Q.addEventListener("inputsourceschange",ZJ),_.xrCompatible!==!0)await $.makeXRCompatible();if(w=J.getPixelRatio(),J.getSize(z),Q.renderState.layers===void 0||J.capabilities.isWebGL2===!1){let s={antialias:Q.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:W};V=new XRWebGLLayer(Q,$,s),Q.updateRenderState({baseLayer:V}),J.setPixelRatio(1),J.setSize(V.framebufferWidth,V.framebufferHeight,!1),F=new R9(V.framebufferWidth,V.framebufferHeight,{format:1023,type:1009,colorSpace:J.outputColorSpace,stencilBuffer:_.stencil})}else{let s=null,YJ=null,HJ=null;if(_.depth)HJ=_.stencil?$.DEPTH24_STENCIL8:$.DEPTH_COMPONENT24,s=_.stencil?1027:1026,YJ=_.stencil?1020:1014;let MJ={colorFormat:$.RGBA8,depthFormat:HJ,scaleFactor:W};K=new XRWebGLBinding(Q,$),E=K.createProjectionLayer(MJ),Q.updateRenderState({layers:[E]}),J.setPixelRatio(1),J.setSize(E.textureWidth,E.textureHeight,!1),F=new R9(E.textureWidth,E.textureHeight,{format:1023,type:1009,depthTexture:new d8(E.textureWidth,E.textureHeight,YJ,void 0,void 0,void 0,void 0,void 0,void 0,s),stencilBuffer:_.stencil,colorSpace:J.outputColorSpace,samples:_.antialias?4:0});let LJ=J.properties.get(F);LJ.__ignoreDepthValues=E.ignoreDepthValues}F.isXRRenderTarget=!0,this.setFoveation(Y),q=null,X=await Q.requestReferenceSpace(H),e.setContext(Q),e.start(),Z.isPresenting=!0,Z.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(Q!==null)return Q.environmentBlendMode};function ZJ(x){for(let s=0;s<x.removed.length;s++){let YJ=x.removed[s],HJ=N.indexOf(YJ);if(HJ>=0)N[HJ]=null,G[HJ].disconnect(YJ)}for(let s=0;s<x.added.length;s++){let YJ=x.added[s],HJ=N.indexOf(YJ);if(HJ===-1){for(let LJ=0;LJ<G.length;LJ++)if(LJ>=N.length){N.push(YJ),HJ=LJ;break}else if(N[LJ]===null){N[LJ]=YJ,HJ=LJ;break}if(HJ===-1)break}let MJ=G[HJ];if(MJ)MJ.connect(YJ)}}let A=new T,l=new T;function m(x,s,YJ){A.setFromMatrixPosition(s.matrixWorld),l.setFromMatrixPosition(YJ.matrixWorld);let HJ=A.distanceTo(l),MJ=s.projectionMatrix.elements,LJ=YJ.projectionMatrix.elements,bJ=MJ[14]/(MJ[10]-1),CJ=MJ[14]/(MJ[10]+1),oJ=(MJ[9]+1)/MJ[5],v=(MJ[9]-1)/MJ[5],w7=(MJ[8]-1)/MJ[0],dJ=(LJ[8]+1)/LJ[0],OJ=bJ*w7,zJ=bJ*dJ,TJ=HJ/(-w7+dJ),uJ=TJ*-w7;s.matrixWorld.decompose(x.position,x.quaternion,x.scale),x.translateX(uJ),x.translateZ(TJ),x.matrixWorld.compose(x.position,x.quaternion,x.scale),x.matrixWorldInverse.copy(x.matrixWorld).invert();let xJ=bJ+TJ,C=CJ+TJ,M=OJ-uJ,h=zJ+(HJ-uJ),r=oJ*CJ/C*xJ,n=v*CJ/C*xJ;x.projectionMatrix.makePerspective(M,h,r,n,xJ,C),x.projectionMatrixInverse.copy(x.projectionMatrix).invert()}function a(x,s){if(s===null)x.matrixWorld.copy(x.matrix);else x.matrixWorld.multiplyMatrices(s.matrixWorld,x.matrix);x.matrixWorldInverse.copy(x.matrixWorld).invert()}this.updateCamera=function(x){if(Q===null)return;if(g.near=L.near=k.near=x.near,g.far=L.far=k.far=x.far,B!==g.near||I!==g.far)Q.updateRenderState({depthNear:g.near,depthFar:g.far}),B=g.near,I=g.far;let s=x.parent,YJ=g.cameras;a(g,s);for(let HJ=0;HJ<YJ.length;HJ++)a(YJ[HJ],s);if(YJ.length===2)m(g,k,L);else g.projectionMatrix.copy(k.projectionMatrix);d(x,g,s)};function d(x,s,YJ){if(YJ===null)x.matrix.copy(s.matrixWorld);else x.matrix.copy(YJ.matrixWorld),x.matrix.invert(),x.matrix.multiply(s.matrixWorld);if(x.matrix.decompose(x.position,x.quaternion,x.scale),x.updateMatrixWorld(!0),x.projectionMatrix.copy(s.projectionMatrix),x.projectionMatrixInverse.copy(s.projectionMatrixInverse),x.isPerspectiveCamera)x.fov=X$*2*Math.atan(1/x.projectionMatrix.elements[5]),x.zoom=1}this.getCamera=function(){return g},this.getFoveation=function(){if(E===null&&V===null)return;return Y},this.setFoveation=function(x){if(Y=x,E!==null)E.fixedFoveation=x;if(V!==null&&V.fixedFoveation!==void 0)V.fixedFoveation=x};let u=null;function t(x,s){if(U=s.getViewerPose(q||X),O=s,U!==null){let YJ=U.views;if(V!==null)J.setRenderTargetFramebuffer(F,V.framebuffer),J.setRenderTarget(F);let HJ=!1;if(YJ.length!==g.cameras.length)g.cameras.length=0,HJ=!0;for(let MJ=0;MJ<YJ.length;MJ++){let LJ=YJ[MJ],bJ=null;if(V!==null)bJ=V.getViewport(LJ);else{let oJ=K.getViewSubImage(E,LJ);if(bJ=oJ.viewport,MJ===0)J.setRenderTargetTextures(F,oJ.colorTexture,E.ignoreDepthValues?void 0:oJ.depthStencilTexture),J.setRenderTarget(F)}let CJ=S[MJ];if(CJ===void 0)CJ=new M7,CJ.layers.enable(MJ),CJ.viewport=new J7,S[MJ]=CJ;if(CJ.matrix.fromArray(LJ.transform.matrix),CJ.matrix.decompose(CJ.position,CJ.quaternion,CJ.scale),CJ.projectionMatrix.fromArray(LJ.projectionMatrix),CJ.projectionMatrixInverse.copy(CJ.projectionMatrix).invert(),CJ.viewport.set(bJ.x,bJ.y,bJ.width,bJ.height),MJ===0)g.matrix.copy(CJ.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale);if(HJ===!0)g.cameras.push(CJ)}}for(let YJ=0;YJ<G.length;YJ++){let HJ=N[YJ],MJ=G[YJ];if(HJ!==null&&MJ!==void 0)MJ.update(HJ,s,q||X)}if(u)u(x,s);if(s.detectedPlanes)Z.dispatchEvent({type:"planesdetected",data:s});O=null}let e=new Q5;e.setAnimationLoop(t),this.setAnimationLoop=function(x){u=x},this.dispose=function(){}}}function gH(J,$){function Z(F,G){if(F.matrixAutoUpdate===!0)F.updateMatrix();G.value.copy(F.matrix)}function Q(F,G){if(G.color.getRGB(F.fogColor.value,J5(J)),G.isFog)F.fogNear.value=G.near,F.fogFar.value=G.far;else if(G.isFogExp2)F.fogDensity.value=G.density}function W(F,G,N,z,w){if(G.isMeshBasicMaterial)X(F,G);else if(G.isMeshLambertMaterial)X(F,G);else if(G.isMeshToonMaterial)X(F,G),E(F,G);else if(G.isMeshPhongMaterial)X(F,G),K(F,G);else if(G.isMeshStandardMaterial){if(X(F,G),V(F,G),G.isMeshPhysicalMaterial)O(F,G,w)}else if(G.isMeshMatcapMaterial)X(F,G),_(F,G);else if(G.isMeshDepthMaterial)X(F,G);else if(G.isMeshDistanceMaterial)X(F,G),R(F,G);else if(G.isMeshNormalMaterial)X(F,G);else if(G.isLineBasicMaterial){if(H(F,G),G.isLineDashedMaterial)Y(F,G)}else if(G.isPointsMaterial)q(F,G,N,z);else if(G.isSpriteMaterial)U(F,G);else if(G.isShadowMaterial)F.color.value.copy(G.color),F.opacity.value=G.opacity;else if(G.isShaderMaterial)G.uniformsNeedUpdate=!1}function X(F,G){if(F.opacity.value=G.opacity,G.color)F.diffuse.value.copy(G.color);if(G.emissive)F.emissive.value.copy(G.emissive).multiplyScalar(G.emissiveIntensity);if(G.map)F.map.value=G.map,Z(G.map,F.mapTransform);if(G.alphaMap)F.alphaMap.value=G.alphaMap,Z(G.alphaMap,F.alphaMapTransform);if(G.bumpMap){if(F.bumpMap.value=G.bumpMap,Z(G.bumpMap,F.bumpMapTransform),F.bumpScale.value=G.bumpScale,G.side===1)F.bumpScale.value*=-1}if(G.normalMap){if(F.normalMap.value=G.normalMap,Z(G.normalMap,F.normalMapTransform),F.normalScale.value.copy(G.normalScale),G.side===1)F.normalScale.value.negate()}if(G.displacementMap)F.displacementMap.value=G.displacementMap,Z(G.displacementMap,F.displacementMapTransform),F.displacementScale.value=G.displacementScale,F.displacementBias.value=G.displacementBias;if(G.emissiveMap)F.emissiveMap.value=G.emissiveMap,Z(G.emissiveMap,F.emissiveMapTransform);if(G.specularMap)F.specularMap.value=G.specularMap,Z(G.specularMap,F.specularMapTransform);if(G.alphaTest>0)F.alphaTest.value=G.alphaTest;let N=$.get(G).envMap;if(N)F.envMap.value=N,F.flipEnvMap.value=N.isCubeTexture&&N.isRenderTargetTexture===!1?-1:1,F.reflectivity.value=G.reflectivity,F.ior.value=G.ior,F.refractionRatio.value=G.refractionRatio;if(G.lightMap){F.lightMap.value=G.lightMap;let z=J._useLegacyLights===!0?Math.PI:1;F.lightMapIntensity.value=G.lightMapIntensity*z,Z(G.lightMap,F.lightMapTransform)}if(G.aoMap)F.aoMap.value=G.aoMap,F.aoMapIntensity.value=G.aoMapIntensity,Z(G.aoMap,F.aoMapTransform)}function H(F,G){if(F.diffuse.value.copy(G.color),F.opacity.value=G.opacity,G.map)F.map.value=G.map,Z(G.map,F.mapTransform)}function Y(F,G){F.dashSize.value=G.dashSize,F.totalSize.value=G.dashSize+G.gapSize,F.scale.value=G.scale}function q(F,G,N,z){if(F.diffuse.value.copy(G.color),F.opacity.value=G.opacity,F.size.value=G.size*N,F.scale.value=z*0.5,G.map)F.map.value=G.map,Z(G.map,F.uvTransform);if(G.alphaMap)F.alphaMap.value=G.alphaMap,Z(G.alphaMap,F.alphaMapTransform);if(G.alphaTest>0)F.alphaTest.value=G.alphaTest}function U(F,G){if(F.diffuse.value.copy(G.color),F.opacity.value=G.opacity,F.rotation.value=G.rotation,G.map)F.map.value=G.map,Z(G.map,F.mapTransform);if(G.alphaMap)F.alphaMap.value=G.alphaMap,Z(G.alphaMap,F.alphaMapTransform);if(G.alphaTest>0)F.alphaTest.value=G.alphaTest}function K(F,G){F.specular.value.copy(G.specular),F.shininess.value=Math.max(G.shininess,0.0001)}function E(F,G){if(G.gradientMap)F.gradientMap.value=G.gradientMap}function V(F,G){if(F.metalness.value=G.metalness,G.metalnessMap)F.metalnessMap.value=G.metalnessMap,Z(G.metalnessMap,F.metalnessMapTransform);if(F.roughness.value=G.roughness,G.roughnessMap)F.roughnessMap.value=G.roughnessMap,Z(G.roughnessMap,F.roughnessMapTransform);if($.get(G).envMap)F.envMapIntensity.value=G.envMapIntensity}function O(F,G,N){if(F.ior.value=G.ior,G.sheen>0){if(F.sheenColor.value.copy(G.sheenColor).multiplyScalar(G.sheen),F.sheenRoughness.value=G.sheenRoughness,G.sheenColorMap)F.sheenColorMap.value=G.sheenColorMap,Z(G.sheenColorMap,F.sheenColorMapTransform);if(G.sheenRoughnessMap)F.sheenRoughnessMap.value=G.sheenRoughnessMap,Z(G.sheenRoughnessMap,F.sheenRoughnessMapTransform)}if(G.clearcoat>0){if(F.clearcoat.value=G.clearcoat,F.clearcoatRoughness.value=G.clearcoatRoughness,G.clearcoatMap)F.clearcoatMap.value=G.clearcoatMap,Z(G.clearcoatMap,F.clearcoatMapTransform);if(G.clearcoatRoughnessMap)F.clearcoatRoughnessMap.value=G.clearcoatRoughnessMap,Z(G.clearcoatRoughnessMap,F.clearcoatRoughnessMapTransform);if(G.clearcoatNormalMap){if(F.clearcoatNormalMap.value=G.clearcoatNormalMap,Z(G.clearcoatNormalMap,F.clearcoatNormalMapTransform),F.clearcoatNormalScale.value.copy(G.clearcoatNormalScale),G.side===1)F.clearcoatNormalScale.value.negate()}}if(G.iridescence>0){if(F.iridescence.value=G.iridescence,F.iridescenceIOR.value=G.iridescenceIOR,F.iridescenceThicknessMinimum.value=G.iridescenceThicknessRange[0],F.iridescenceThicknessMaximum.value=G.iridescenceThicknessRange[1],G.iridescenceMap)F.iridescenceMap.value=G.iridescenceMap,Z(G.iridescenceMap,F.iridescenceMapTransform);if(G.iridescenceThicknessMap)F.iridescenceThicknessMap.value=G.iridescenceThicknessMap,Z(G.iridescenceThicknessMap,F.iridescenceThicknessMapTransform)}if(G.transmission>0){if(F.transmission.value=G.transmission,F.transmissionSamplerMap.value=N.texture,F.transmissionSamplerSize.value.set(N.width,N.height),G.transmissionMap)F.transmissionMap.value=G.transmissionMap,Z(G.transmissionMap,F.transmissionMapTransform);if(F.thickness.value=G.thickness,G.thicknessMap)F.thicknessMap.value=G.thicknessMap,Z(G.thicknessMap,F.thicknessMapTransform);F.attenuationDistance.value=G.attenuationDistance,F.attenuationColor.value.copy(G.attenuationColor)}if(G.anisotropy>0){if(F.anisotropyVector.value.set(G.anisotropy*Math.cos(G.anisotropyRotation),G.anisotropy*Math.sin(G.anisotropyRotation)),G.anisotropyMap)F.anisotropyMap.value=G.anisotropyMap,Z(G.anisotropyMap,F.anisotropyMapTransform)}if(F.specularIntensity.value=G.specularIntensity,F.specularColor.value.copy(G.specularColor),G.specularColorMap)F.specularColorMap.value=G.specularColorMap,Z(G.specularColorMap,F.specularColorMapTransform);if(G.specularIntensityMap)F.specularIntensityMap.value=G.specularIntensityMap,Z(G.specularIntensityMap,F.specularIntensityMapTransform)}function _(F,G){if(G.matcap)F.matcap.value=G.matcap}function R(F,G){let N=$.get(G).light;F.referencePosition.value.setFromMatrixPosition(N.matrixWorld),F.nearDistance.value=N.shadow.camera.near,F.farDistance.value=N.shadow.camera.far}return{refreshFogUniforms:Q,refreshMaterialUniforms:W}}function pH(J,$,Z,Q){let W={},X={},H=[],Y=Z.isWebGL2?J.getParameter(J.MAX_UNIFORM_BUFFER_BINDINGS):0;function q(N,z){let w=z.program;Q.uniformBlockBinding(N,w)}function U(N,z){let w=W[N.id];if(w===void 0)_(N),w=K(N),W[N.id]=w,N.addEventListener("dispose",F);let k=z.program;Q.updateUBOMapping(N,k);let L=$.render.frame;if(X[N.id]!==L)V(N),X[N.id]=L}function K(N){let z=E();N.__bindingPointIndex=z;let w=J.createBuffer(),k=N.__size,L=N.usage;return J.bindBuffer(J.UNIFORM_BUFFER,w),J.bufferData(J.UNIFORM_BUFFER,k,L),J.bindBuffer(J.UNIFORM_BUFFER,null),J.bindBufferBase(J.UNIFORM_BUFFER,z,w),w}function E(){for(let N=0;N<Y;N++)if(H.indexOf(N)===-1)return H.push(N),N;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function V(N){let z=W[N.id],w=N.uniforms,k=N.__cache;J.bindBuffer(J.UNIFORM_BUFFER,z);for(let L=0,S=w.length;L<S;L++){let g=Array.isArray(w[L])?w[L]:[w[L]];for(let B=0,I=g.length;B<I;B++){let y=g[B];if(O(y,L,B,k)===!0){let c=y.__offset,ZJ=Array.isArray(y.value)?y.value:[y.value],A=0;for(let l=0;l<ZJ.length;l++){let m=ZJ[l],a=R(m);if(typeof m==="number"||typeof m==="boolean")y.__data[0]=m,J.bufferSubData(J.UNIFORM_BUFFER,c+A,y.__data);else if(m.isMatrix3)y.__data[0]=m.elements[0],y.__data[1]=m.elements[1],y.__data[2]=m.elements[2],y.__data[3]=0,y.__data[4]=m.elements[3],y.__data[5]=m.elements[4],y.__data[6]=m.elements[5],y.__data[7]=0,y.__data[8]=m.elements[6],y.__data[9]=m.elements[7],y.__data[10]=m.elements[8],y.__data[11]=0;else m.toArray(y.__data,A),A+=a.storage/Float32Array.BYTES_PER_ELEMENT}J.bufferSubData(J.UNIFORM_BUFFER,c,y.__data)}}}J.bindBuffer(J.UNIFORM_BUFFER,null)}function O(N,z,w,k){let L=N.value,S=z+"_"+w;if(k[S]===void 0){if(typeof L==="number"||typeof L==="boolean")k[S]=L;else k[S]=L.clone();return!0}else{let g=k[S];if(typeof L==="number"||typeof L==="boolean"){if(g!==L)return k[S]=L,!0}else if(g.equals(L)===!1)return g.copy(L),!0}return!1}function _(N){let z=N.uniforms,w=0,k=16;for(let S=0,g=z.length;S<g;S++){let B=Array.isArray(z[S])?z[S]:[z[S]];for(let I=0,y=B.length;I<y;I++){let c=B[I],ZJ=Array.isArray(c.value)?c.value:[c.value];for(let A=0,l=ZJ.length;A<l;A++){let m=ZJ[A],a=R(m),d=w%k;if(d!==0&&k-d<a.boundary)w+=k-d;c.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),c.__offset=w,w+=a.storage}}}let L=w%k;if(L>0)w+=k-L;return N.__size=w,N.__cache={},this}function R(N){let z={boundary:0,storage:0};if(typeof N==="number"||typeof N==="boolean")z.boundary=4,z.storage=4;else if(N.isVector2)z.boundary=8,z.storage=8;else if(N.isVector3||N.isColor)z.boundary=16,z.storage=12;else if(N.isVector4)z.boundary=16,z.storage=16;else if(N.isMatrix3)z.boundary=48,z.storage=48;else if(N.isMatrix4)z.boundary=64,z.storage=64;else if(N.isTexture)console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group.");else console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",N);return z}function F(N){let z=N.target;z.removeEventListener("dispose",F);let w=H.indexOf(z.__bindingPointIndex);H.splice(w,1),J.deleteBuffer(W[z.id]),delete W[z.id],delete X[z.id]}function G(){for(let N in W)J.deleteBuffer(W[N]);H=[],W={},X={}}return{bind:q,update:U,dispose:G}}class y0{constructor(J={}){let{canvas:$=oQ(),context:Z=null,depth:Q=!0,stencil:W=!0,alpha:X=!1,antialias:H=!1,premultipliedAlpha:Y=!0,preserveDrawingBuffer:q=!1,powerPreference:U="default",failIfMajorPerformanceCaveat:K=!1}=J;this.isWebGLRenderer=!0;let E;if(Z!==null)E=Z.getContextAttributes().alpha;else E=X;let V=new Uint32Array(4),O=new Int32Array(4),_=null,R=null,F=[],G=[];this.domElement=$,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace="srgb",this._useLegacyLights=!1,this.toneMapping=0,this.toneMappingExposure=1;let N=this,z=!1,w=0,k=0,L=null,S=-1,g=null,B=new J7,I=new J7,y=null,c=new GJ(0),ZJ=0,A=$.width,l=$.height,m=1,a=null,d=null,u=new J7(0,0,A,l),t=new J7(0,0,A,l),e=!1,x=new j0,s=!1,YJ=!1,HJ=null,MJ=new AJ,LJ=new yJ,bJ=new T,CJ={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function oJ(){return L===null?m:1}let v=Z;function w7(D,j){for(let b=0;b<D.length;b++){let p=D[b],f=$.getContext(p,j);if(f!==null)return f}return null}try{let D={alpha:!0,depth:Q,stencil:W,antialias:H,premultipliedAlpha:Y,preserveDrawingBuffer:q,powerPreference:U,failIfMajorPerformanceCaveat:K};if("setAttribute"in $)$.setAttribute("data-engine","three.js r160");if($.addEventListener("webglcontextlost",tJ,!1),$.addEventListener("webglcontextrestored",JJ,!1),$.addEventListener("webglcontextcreationerror",P,!1),v===null){let j=["webgl2","webgl","experimental-webgl"];if(N.isWebGL1Renderer===!0)j.shift();if(v=w7(j,D),v===null)if(w7(j))throw Error("Error creating WebGL context with your selected attributes.");else throw Error("Error creating WebGL context.")}if(typeof WebGLRenderingContext<"u"&&v instanceof WebGLRenderingContext)console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163.");if(v.getShaderPrecisionFormat===void 0)v.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}}}catch(D){throw console.error("THREE.WebGLRenderer: "+D.message),D}let dJ,OJ,zJ,TJ,uJ,xJ,C,M,h,r,n,o,_J,WJ,UJ,FJ,SJ,i,U7,gJ,IJ,KJ,EJ,pJ;function rJ(){dJ=new X4(v),OJ=new eY(v,dJ,J),dJ.init(OJ),KJ=new hH(v,dJ,OJ),zJ=new xH(v,dJ,OJ),TJ=new q4(v),uJ=new LH,xJ=new fH(v,dJ,zJ,uJ,OJ,KJ,TJ),C=new $4(N),M=new W4(N),h=new RW(v,OJ),EJ=new rY(v,dJ,h,OJ),r=new Y4(v,h,TJ,EJ),n=new V4(v,r,h,TJ),U7=new E4(v,OJ,xJ),FJ=new J4(uJ),o=new DH(N,C,M,dJ,OJ,EJ,FJ),_J=new gH(N,uJ),WJ=new wH,UJ=new SH(dJ,OJ),i=new aY(N,C,M,zJ,n,E,Y),SJ=new yH(N,n,OJ),pJ=new pH(v,TJ,OJ,zJ),gJ=new tY(v,dJ,TJ,OJ),IJ=new H4(v,dJ,TJ,OJ),TJ.programs=o.programs,N.capabilities=OJ,N.extensions=dJ,N.properties=uJ,N.renderLists=WJ,N.shadowMap=SJ,N.state=zJ,N.info=TJ}rJ();let cJ=new _5(N,v);this.xr=cJ,this.getContext=function(){return v},this.getContextAttributes=function(){return v.getContextAttributes()},this.forceContextLoss=function(){let D=dJ.get("WEBGL_lose_context");if(D)D.loseContext()},this.forceContextRestore=function(){let D=dJ.get("WEBGL_lose_context");if(D)D.restoreContext()},this.getPixelRatio=function(){return m},this.setPixelRatio=function(D){if(D===void 0)return;m=D,this.setSize(A,l,!1)},this.getSize=function(D){return D.set(A,l)},this.setSize=function(D,j,b=!0){if(cJ.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}if(A=D,l=j,$.width=Math.floor(D*m),$.height=Math.floor(j*m),b===!0)$.style.width=D+"px",$.style.height=j+"px";this.setViewport(0,0,D,j)},this.getDrawingBufferSize=function(D){return D.set(A*m,l*m).floor()},this.setDrawingBufferSize=function(D,j,b){A=D,l=j,m=b,$.width=Math.floor(D*b),$.height=Math.floor(j*b),this.setViewport(0,0,D,j)},this.getCurrentViewport=function(D){return D.copy(B)},this.getViewport=function(D){return D.copy(u)},this.setViewport=function(D,j,b,p){if(D.isVector4)u.set(D.x,D.y,D.z,D.w);else u.set(D,j,b,p);zJ.viewport(B.copy(u).multiplyScalar(m).floor())},this.getScissor=function(D){return D.copy(t)},this.setScissor=function(D,j,b,p){if(D.isVector4)t.set(D.x,D.y,D.z,D.w);else t.set(D,j,b,p);zJ.scissor(I.copy(t).multiplyScalar(m).floor())},this.getScissorTest=function(){return e},this.setScissorTest=function(D){zJ.setScissorTest(e=D)},this.setOpaqueSort=function(D){a=D},this.setTransparentSort=function(D){d=D},this.getClearColor=function(D){return D.copy(i.getClearColor())},this.setClearColor=function(){i.setClearColor.apply(i,arguments)},this.getClearAlpha=function(){return i.getClearAlpha()},this.setClearAlpha=function(){i.setClearAlpha.apply(i,arguments)},this.clear=function(D=!0,j=!0,b=!0){let p=0;if(D){let f=!1;if(L!==null){let qJ=L.texture.format;f=qJ===1033||qJ===1031||qJ===1029}if(f){let qJ=L.texture.type,VJ=qJ===1009||qJ===1014||qJ===1012||qJ===1020||qJ===1017||qJ===1018,NJ=i.getClearColor(),wJ=i.getClearAlpha(),vJ=NJ.r,kJ=NJ.g,PJ=NJ.b;if(VJ)V[0]=vJ,V[1]=kJ,V[2]=PJ,V[3]=wJ,v.clearBufferuiv(v.COLOR,0,V);else O[0]=vJ,O[1]=kJ,O[2]=PJ,O[3]=wJ,v.clearBufferiv(v.COLOR,0,O)}else p|=v.COLOR_BUFFER_BIT}if(j)p|=v.DEPTH_BUFFER_BIT;if(b)p|=v.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);v.clear(p)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){if($.removeEventListener("webglcontextlost",tJ,!1),$.removeEventListener("webglcontextrestored",JJ,!1),$.removeEventListener("webglcontextcreationerror",P,!1),WJ.dispose(),UJ.dispose(),uJ.dispose(),C.dispose(),M.dispose(),n.dispose(),EJ.dispose(),pJ.dispose(),o.dispose(),cJ.dispose(),cJ.removeEventListener("sessionstart",F7),cJ.removeEventListener("sessionend",I7),HJ)HJ.dispose(),HJ=null;nJ.stop()};function tJ(D){D.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),z=!0}function JJ(){console.log("THREE.WebGLRenderer: Context Restored."),z=!1;let D=TJ.autoReset,j=SJ.enabled,b=SJ.autoUpdate,p=SJ.needsUpdate,f=SJ.type;rJ(),TJ.autoReset=D,SJ.enabled=j,SJ.autoUpdate=b,SJ.needsUpdate=p,SJ.type=f}function P(D){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",D.statusMessage)}function QJ(D){let j=D.target;j.removeEventListener("dispose",QJ),XJ(j)}function XJ(D){BJ(D),uJ.remove(D)}function BJ(D){let j=uJ.get(D).programs;if(j!==void 0){if(j.forEach(function(b){o.releaseProgram(b)}),D.isShaderMaterial)o.releaseShaderCache(D)}}this.renderBufferDirect=function(D,j,b,p,f,qJ){if(j===null)j=CJ;let VJ=f.isMesh&&f.matrixWorld.determinant()<0,NJ=LQ(D,j,b,p,f);zJ.setMaterial(p,VJ);let wJ=b.index,vJ=1;if(p.wireframe===!0){if(wJ=r.getWireframeAttribute(b),wJ===void 0)return;vJ=2}let kJ=b.drawRange,PJ=b.attributes.position,q7=kJ.start*vJ,S7=(kJ.start+kJ.count)*vJ;if(qJ!==null)q7=Math.max(q7,qJ.start*vJ),S7=Math.min(S7,(qJ.start+qJ.count)*vJ);if(wJ!==null)q7=Math.max(q7,0),S7=Math.min(S7,wJ.count);else if(PJ!==void 0&&PJ!==null)q7=Math.max(q7,0),S7=Math.min(S7,PJ.count);let N7=S7-q7;if(N7<0||N7===1/0)return;EJ.setup(f,p,NJ,b,wJ);let $9,W7=gJ;if(wJ!==null)$9=h.get(wJ),W7=IJ,W7.setIndex($9);if(f.isMesh)if(p.wireframe===!0)zJ.setLineWidth(p.wireframeLinewidth*oJ()),W7.setMode(v.LINES);else W7.setMode(v.TRIANGLES);else if(f.isLine){let fJ=p.linewidth;if(fJ===void 0)fJ=1;if(zJ.setLineWidth(fJ*oJ()),f.isLineSegments)W7.setMode(v.LINES);else if(f.isLineLoop)W7.setMode(v.LINE_LOOP);else W7.setMode(v.LINE_STRIP)}else if(f.isPoints)W7.setMode(v.POINTS);else if(f.isSprite)W7.setMode(v.TRIANGLES);if(f.isBatchedMesh)W7.renderMultiDraw(f._multiDrawStarts,f._multiDrawCounts,f._multiDrawCount);else if(f.isInstancedMesh)W7.renderInstances(q7,N7,f.count);else if(b.isInstancedBufferGeometry){let fJ=b._maxInstanceCount!==void 0?b._maxInstanceCount:1/0,o0=Math.min(b.instanceCount,fJ);W7.renderInstances(q7,N7,o0)}else W7.render(q7,N7)};function RJ(D,j,b){if(D.transparent===!0&&D.side===2&&D.forceSinglePass===!1)D.side=1,D.needsUpdate=!0,e$(D,j,b),D.side=0,D.needsUpdate=!0,e$(D,j,b),D.side=2;else e$(D,j,b)}this.compile=function(D,j,b=null){if(b===null)b=D;if(R=UJ.get(b),R.init(),G.push(R),b.traverseVisible(function(f){if(f.isLight&&f.layers.test(j.layers)){if(R.pushLight(f),f.castShadow)R.pushShadow(f)}}),D!==b)D.traverseVisible(function(f){if(f.isLight&&f.layers.test(j.layers)){if(R.pushLight(f),f.castShadow)R.pushShadow(f)}});R.setupLights(N._useLegacyLights);let p=new Set;return D.traverse(function(f){let qJ=f.material;if(qJ)if(Array.isArray(qJ))for(let VJ=0;VJ<qJ.length;VJ++){let NJ=qJ[VJ];RJ(NJ,b,f),p.add(NJ)}else RJ(qJ,b,f),p.add(qJ)}),G.pop(),R=null,p},this.compileAsync=function(D,j,b=null){let p=this.compile(D,j,b);return new Promise((f)=>{function qJ(){if(p.forEach(function(VJ){if(uJ.get(VJ).currentProgram.isReady())p.delete(VJ)}),p.size===0){f(D);return}setTimeout(qJ,10)}if(dJ.get("KHR_parallel_shader_compile")!==null)qJ();else setTimeout(qJ,10)})};let eJ=null;function Q7(D){if(eJ)eJ(D)}function F7(){nJ.stop()}function I7(){nJ.start()}let nJ=new Q5;if(nJ.setAnimationLoop(Q7),typeof self<"u")nJ.setContext(self);this.setAnimationLoop=function(D){eJ=D,cJ.setAnimationLoop(D),D===null?nJ.stop():nJ.start()},cJ.addEventListener("sessionstart",F7),cJ.addEventListener("sessionend",I7),this.render=function(D,j){if(j!==void 0&&j.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(z===!0)return;if(D.matrixWorldAutoUpdate===!0)D.updateMatrixWorld();if(j.parent===null&&j.matrixWorldAutoUpdate===!0)j.updateMatrixWorld();if(cJ.enabled===!0&&cJ.isPresenting===!0){if(cJ.cameraAutoUpdate===!0)cJ.updateCamera(j);j=cJ.getCamera()}if(D.isScene===!0)D.onBeforeRender(N,D,j,L);if(R=UJ.get(D,G.length),R.init(),G.push(R),MJ.multiplyMatrices(j.projectionMatrix,j.matrixWorldInverse),x.setFromProjectionMatrix(MJ),YJ=this.localClippingEnabled,s=FJ.init(this.clippingPlanes,YJ),_=WJ.get(D,F.length),_.init(),F.push(_),o7(D,j,0,N.sortObjects),_.finish(),N.sortObjects===!0)_.sort(a,d);if(this.info.render.frame++,s===!0)FJ.beginShadows();let b=R.state.shadowsArray;if(SJ.render(b,D,j),s===!0)FJ.endShadows();if(this.info.autoReset===!0)this.info.reset();if(i.render(_,D),R.setupLights(N._useLegacyLights),j.isArrayCamera){let p=j.cameras;for(let f=0,qJ=p.length;f<qJ;f++){let VJ=p[f];a7(_,D,VJ,VJ.viewport)}}else a7(_,D,j);if(L!==null)xJ.updateMultisampleRenderTarget(L),xJ.updateRenderTargetMipmap(L);if(D.isScene===!0)D.onAfterRender(N,D,j);if(EJ.resetDefaultState(),S=-1,g=null,G.pop(),G.length>0)R=G[G.length-1];else R=null;if(F.pop(),F.length>0)_=F[F.length-1];else _=null};function o7(D,j,b,p){if(D.visible===!1)return;if(D.layers.test(j.layers)){if(D.isGroup)b=D.renderOrder;else if(D.isLOD){if(D.autoUpdate===!0)D.update(j)}else if(D.isLight){if(R.pushLight(D),D.castShadow)R.pushShadow(D)}else if(D.isSprite){if(!D.frustumCulled||x.intersectsSprite(D)){if(p)bJ.setFromMatrixPosition(D.matrixWorld).applyMatrix4(MJ);let VJ=n.update(D),NJ=D.material;if(NJ.visible)_.push(D,VJ,NJ,b,bJ.z,null)}}else if(D.isMesh||D.isLine||D.isPoints){if(!D.frustumCulled||x.intersectsObject(D)){let VJ=n.update(D),NJ=D.material;if(p){if(D.boundingSphere!==void 0){if(D.boundingSphere===null)D.computeBoundingSphere();bJ.copy(D.boundingSphere.center)}else{if(VJ.boundingSphere===null)VJ.computeBoundingSphere();bJ.copy(VJ.boundingSphere.center)}bJ.applyMatrix4(D.matrixWorld).applyMatrix4(MJ)}if(Array.isArray(NJ)){let wJ=VJ.groups;for(let vJ=0,kJ=wJ.length;vJ<kJ;vJ++){let PJ=wJ[vJ],q7=NJ[PJ.materialIndex];if(q7&&q7.visible)_.push(D,VJ,q7,b,bJ.z,PJ)}}else if(NJ.visible)_.push(D,VJ,NJ,b,bJ.z,null)}}}let qJ=D.children;for(let VJ=0,NJ=qJ.length;VJ<NJ;VJ++)o7(qJ[VJ],j,b,p)}function a7(D,j,b,p){let{opaque:f,transmissive:qJ,transparent:VJ}=D;if(R.setupLightsView(b),s===!0)FJ.setGlobalState(N.clippingPlanes,b);if(qJ.length>0)DQ(f,qJ,j,b);if(p)zJ.viewport(B.copy(p));if(f.length>0)t$(f,j,b);if(qJ.length>0)t$(qJ,j,b);if(VJ.length>0)t$(VJ,j,b);zJ.buffers.depth.setTest(!0),zJ.buffers.depth.setMask(!0),zJ.buffers.color.setMask(!0),zJ.setPolygonOffset(!1)}function DQ(D,j,b,p){if((b.isScene===!0?b.overrideMaterial:null)!==null)return;let qJ=OJ.isWebGL2;if(HJ===null)HJ=new R9(1,1,{generateMipmaps:!0,type:dJ.has("EXT_color_buffer_half_float")?1016:1009,minFilter:1008,samples:qJ?4:0});if(N.getDrawingBufferSize(LJ),qJ)HJ.setSize(LJ.x,LJ.y);else HJ.setSize(A0(LJ.x),A0(LJ.y));let VJ=N.getRenderTarget();if(N.setRenderTarget(HJ),N.getClearColor(c),ZJ=N.getClearAlpha(),ZJ<1)N.setClearColor(16777215,0.5);N.clear();let NJ=N.toneMapping;N.toneMapping=0,t$(D,b,p),xJ.updateMultisampleRenderTarget(HJ),xJ.updateRenderTargetMipmap(HJ);let wJ=!1;for(let vJ=0,kJ=j.length;vJ<kJ;vJ++){let PJ=j[vJ],q7=PJ.object,S7=PJ.geometry,N7=PJ.material,$9=PJ.group;if(N7.side===2&&q7.layers.test(p.layers)){let W7=N7.side;N7.side=1,N7.needsUpdate=!0,T6(q7,b,p,S7,N7,$9),N7.side=W7,N7.needsUpdate=!0,wJ=!0}}if(wJ===!0)xJ.updateMultisampleRenderTarget(HJ),xJ.updateRenderTargetMipmap(HJ);N.setRenderTarget(VJ),N.setClearColor(c,ZJ),N.toneMapping=NJ}function t$(D,j,b){let p=j.isScene===!0?j.overrideMaterial:null;for(let f=0,qJ=D.length;f<qJ;f++){let VJ=D[f],NJ=VJ.object,wJ=VJ.geometry,vJ=p===null?VJ.material:p,kJ=VJ.group;if(NJ.layers.test(b.layers))T6(NJ,j,b,wJ,vJ,kJ)}}function T6(D,j,b,p,f,qJ){if(D.onBeforeRender(N,j,b,p,f,qJ),D.modelViewMatrix.multiplyMatrices(b.matrixWorldInverse,D.matrixWorld),D.normalMatrix.getNormalMatrix(D.modelViewMatrix),f.onBeforeRender(N,j,b,p,D,qJ),f.transparent===!0&&f.side===2&&f.forceSinglePass===!1)f.side=1,f.needsUpdate=!0,N.renderBufferDirect(b,j,p,f,D,qJ),f.side=0,f.needsUpdate=!0,N.renderBufferDirect(b,j,p,f,D,qJ),f.side=2;else N.renderBufferDirect(b,j,p,f,D,qJ);D.onAfterRender(N,j,b,p,f,qJ)}function e$(D,j,b){if(j.isScene!==!0)j=CJ;let p=uJ.get(D),f=R.state.lights,qJ=R.state.shadowsArray,VJ=f.state.version,NJ=o.getParameters(D,f.state,qJ,j,b),wJ=o.getProgramCacheKey(NJ),vJ=p.programs;if(p.environment=D.isMeshStandardMaterial?j.environment:null,p.fog=j.fog,p.envMap=(D.isMeshStandardMaterial?M:C).get(D.envMap||p.environment),vJ===void 0)D.addEventListener("dispose",QJ),vJ=new Map,p.programs=vJ;let kJ=vJ.get(wJ);if(kJ!==void 0){if(p.currentProgram===kJ&&p.lightsStateVersion===VJ)return j6(D,NJ),kJ}else NJ.uniforms=o.getUniforms(D),D.onBuild(b,NJ,N),D.onBeforeCompile(NJ,N),kJ=o.acquireProgram(NJ,wJ),vJ.set(wJ,kJ),p.uniforms=NJ.uniforms;let PJ=p.uniforms;if(!D.isShaderMaterial&&!D.isRawShaderMaterial||D.clipping===!0)PJ.clippingPlanes=FJ.uniform;if(j6(D,NJ),p.needsLights=wQ(D),p.lightsStateVersion=VJ,p.needsLights)PJ.ambientLightColor.value=f.state.ambient,PJ.lightProbe.value=f.state.probe,PJ.directionalLights.value=f.state.directional,PJ.directionalLightShadows.value=f.state.directionalShadow,PJ.spotLights.value=f.state.spot,PJ.spotLightShadows.value=f.state.spotShadow,PJ.rectAreaLights.value=f.state.rectArea,PJ.ltc_1.value=f.state.rectAreaLTC1,PJ.ltc_2.value=f.state.rectAreaLTC2,PJ.pointLights.value=f.state.point,PJ.pointLightShadows.value=f.state.pointShadow,PJ.hemisphereLights.value=f.state.hemi,PJ.directionalShadowMap.value=f.state.directionalShadowMap,PJ.directionalShadowMatrix.value=f.state.directionalShadowMatrix,PJ.spotShadowMap.value=f.state.spotShadowMap,PJ.spotLightMatrix.value=f.state.spotLightMatrix,PJ.spotLightMap.value=f.state.spotLightMap,PJ.pointShadowMap.value=f.state.pointShadowMap,PJ.pointShadowMatrix.value=f.state.pointShadowMatrix;return p.currentProgram=kJ,p.uniformsList=null,kJ}function S6(D){if(D.uniformsList===null){let j=D.currentProgram.getUniforms();D.uniformsList=A$.seqWithValue(j.seq,D.uniforms)}return D.uniformsList}function j6(D,j){let b=uJ.get(D);b.outputColorSpace=j.outputColorSpace,b.batching=j.batching,b.instancing=j.instancing,b.instancingColor=j.instancingColor,b.skinning=j.skinning,b.morphTargets=j.morphTargets,b.morphNormals=j.morphNormals,b.morphColors=j.morphColors,b.morphTargetsCount=j.morphTargetsCount,b.numClippingPlanes=j.numClippingPlanes,b.numIntersection=j.numClipIntersection,b.vertexAlphas=j.vertexAlphas,b.vertexTangents=j.vertexTangents,b.toneMapping=j.toneMapping}function LQ(D,j,b,p,f){if(j.isScene!==!0)j=CJ;xJ.resetTextureUnits();let qJ=j.fog,VJ=p.isMeshStandardMaterial?j.environment:null,NJ=L===null?N.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:"srgb-linear",wJ=(p.isMeshStandardMaterial?M:C).get(p.envMap||VJ),vJ=p.vertexColors===!0&&!!b.attributes.color&&b.attributes.color.itemSize===4,kJ=!!b.attributes.tangent&&(!!p.normalMap||p.anisotropy>0),PJ=!!b.morphAttributes.position,q7=!!b.morphAttributes.normal,S7=!!b.morphAttributes.color,N7=0;if(p.toneMapped){if(L===null||L.isXRRenderTarget===!0)N7=N.toneMapping}let $9=b.morphAttributes.position||b.morphAttributes.normal||b.morphAttributes.color,W7=$9!==void 0?$9.length:0,fJ=uJ.get(p),o0=R.state.lights;if(s===!0){if(YJ===!0||D!==g){let h7=D===g&&p.id===S;FJ.setState(p,D,h7)}}let Y7=!1;if(p.version===fJ.__version){if(fJ.needsLights&&fJ.lightsStateVersion!==o0.state.version)Y7=!0;else if(fJ.outputColorSpace!==NJ)Y7=!0;else if(f.isBatchedMesh&&fJ.batching===!1)Y7=!0;else if(!f.isBatchedMesh&&fJ.batching===!0)Y7=!0;else if(f.isInstancedMesh&&fJ.instancing===!1)Y7=!0;else if(!f.isInstancedMesh&&fJ.instancing===!0)Y7=!0;else if(f.isSkinnedMesh&&fJ.skinning===!1)Y7=!0;else if(!f.isSkinnedMesh&&fJ.skinning===!0)Y7=!0;else if(f.isInstancedMesh&&fJ.instancingColor===!0&&f.instanceColor===null)Y7=!0;else if(f.isInstancedMesh&&fJ.instancingColor===!1&&f.instanceColor!==null)Y7=!0;else if(fJ.envMap!==wJ)Y7=!0;else if(p.fog===!0&&fJ.fog!==qJ)Y7=!0;else if(fJ.numClippingPlanes!==void 0&&(fJ.numClippingPlanes!==FJ.numPlanes||fJ.numIntersection!==FJ.numIntersection))Y7=!0;else if(fJ.vertexAlphas!==vJ)Y7=!0;else if(fJ.vertexTangents!==kJ)Y7=!0;else if(fJ.morphTargets!==PJ)Y7=!0;else if(fJ.morphNormals!==q7)Y7=!0;else if(fJ.morphColors!==S7)Y7=!0;else if(fJ.toneMapping!==N7)Y7=!0;else if(OJ.isWebGL2===!0&&fJ.morphTargetsCount!==W7)Y7=!0}else Y7=!0,fJ.__version=p.version;let w9=fJ.currentProgram;if(Y7===!0)w9=e$(p,j,f);let v6=!1,N$=!1,a0=!1,B7=w9.getUniforms(),I9=fJ.uniforms;if(zJ.useProgram(w9.program))v6=!0,N$=!0,a0=!0;if(p.id!==S)S=p.id,N$=!0;if(v6||g!==D){B7.setValue(v,"projectionMatrix",D.projectionMatrix),B7.setValue(v,"viewMatrix",D.matrixWorldInverse);let h7=B7.map.cameraPosition;if(h7!==void 0)h7.setValue(v,bJ.setFromMatrixPosition(D.matrixWorld));if(OJ.logarithmicDepthBuffer)B7.setValue(v,"logDepthBufFC",2/(Math.log(D.far+1)/Math.LN2));if(p.isMeshPhongMaterial||p.isMeshToonMaterial||p.isMeshLambertMaterial||p.isMeshBasicMaterial||p.isMeshStandardMaterial||p.isShaderMaterial)B7.setValue(v,"isOrthographic",D.isOrthographicCamera===!0);if(g!==D)g=D,N$=!0,a0=!0}if(f.isSkinnedMesh){B7.setOptional(v,f,"bindMatrix"),B7.setOptional(v,f,"bindMatrixInverse");let h7=f.skeleton;if(h7)if(OJ.floatVertexTextures){if(h7.boneTexture===null)h7.computeBoneTexture();B7.setValue(v,"boneTexture",h7.boneTexture,xJ)}else console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required.")}if(f.isBatchedMesh)B7.setOptional(v,f,"batchingTexture"),B7.setValue(v,"batchingTexture",f._matricesTexture,xJ);let r0=b.morphAttributes;if(r0.position!==void 0||r0.normal!==void 0||r0.color!==void 0&&OJ.isWebGL2===!0)U7.update(f,b,w9);if(N$||fJ.receiveShadow!==f.receiveShadow)fJ.receiveShadow=f.receiveShadow,B7.setValue(v,"receiveShadow",f.receiveShadow);if(p.isMeshGouraudMaterial&&p.envMap!==null)I9.envMap.value=wJ,I9.flipEnvMap.value=wJ.isCubeTexture&&wJ.isRenderTargetTexture===!1?-1:1;if(N$){if(B7.setValue(v,"toneMappingExposure",N.toneMappingExposure),fJ.needsLights)CQ(I9,a0);if(qJ&&p.fog===!0)_J.refreshFogUniforms(I9,qJ);_J.refreshMaterialUniforms(I9,p,m,l,HJ),A$.upload(v,S6(fJ),I9,xJ)}if(p.isShaderMaterial&&p.uniformsNeedUpdate===!0)A$.upload(v,S6(fJ),I9,xJ),p.uniformsNeedUpdate=!1;if(p.isSpriteMaterial)B7.setValue(v,"center",f.center);if(B7.setValue(v,"modelViewMatrix",f.modelViewMatrix),B7.setValue(v,"normalMatrix",f.normalMatrix),B7.setValue(v,"modelMatrix",f.matrixWorld),p.isShaderMaterial||p.isRawShaderMaterial){let h7=p.uniformsGroups;for(let t0=0,IQ=h7.length;t0<IQ;t0++)if(OJ.isWebGL2){let y6=h7[t0];pJ.update(y6,w9),pJ.bind(y6,w9)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return w9}function CQ(D,j){D.ambientLightColor.needsUpdate=j,D.lightProbe.needsUpdate=j,D.directionalLights.needsUpdate=j,D.directionalLightShadows.needsUpdate=j,D.pointLights.needsUpdate=j,D.pointLightShadows.needsUpdate=j,D.spotLights.needsUpdate=j,D.spotLightShadows.needsUpdate=j,D.rectAreaLights.needsUpdate=j,D.hemisphereLights.needsUpdate=j}function wQ(D){return D.isMeshLambertMaterial||D.isMeshToonMaterial||D.isMeshPhongMaterial||D.isMeshStandardMaterial||D.isShadowMaterial||D.isShaderMaterial&&D.lights===!0}if(this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return k},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(D,j,b){uJ.get(D.texture).__webglTexture=j,uJ.get(D.depthTexture).__webglTexture=b;let p=uJ.get(D);if(p.__hasExternalTextures=!0,p.__hasExternalTextures){if(p.__autoAllocateDepthBuffer=b===void 0,!p.__autoAllocateDepthBuffer){if(dJ.has("WEBGL_multisampled_render_to_texture")===!0)console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),p.__useRenderToTexture=!1}}},this.setRenderTargetFramebuffer=function(D,j){let b=uJ.get(D);b.__webglFramebuffer=j,b.__useDefaultFramebuffer=j===void 0},this.setRenderTarget=function(D,j=0,b=0){L=D,w=j,k=b;let p=!0,f=null,qJ=!1,VJ=!1;if(D){let wJ=uJ.get(D);if(wJ.__useDefaultFramebuffer!==void 0)zJ.bindFramebuffer(v.FRAMEBUFFER,null),p=!1;else if(wJ.__webglFramebuffer===void 0)xJ.setupRenderTarget(D);else if(wJ.__hasExternalTextures)xJ.rebindTextures(D,uJ.get(D.texture).__webglTexture,uJ.get(D.depthTexture).__webglTexture);let vJ=D.texture;if(vJ.isData3DTexture||vJ.isDataArrayTexture||vJ.isCompressedArrayTexture)VJ=!0;let kJ=uJ.get(D).__webglFramebuffer;if(D.isWebGLCubeRenderTarget){if(Array.isArray(kJ[j]))f=kJ[j][b];else f=kJ[j];qJ=!0}else if(OJ.isWebGL2&&D.samples>0&&xJ.useMultisampledRTT(D)===!1)f=uJ.get(D).__webglMultisampledFramebuffer;else if(Array.isArray(kJ))f=kJ[b];else f=kJ;B.copy(D.viewport),I.copy(D.scissor),y=D.scissorTest}else B.copy(u).multiplyScalar(m).floor(),I.copy(t).multiplyScalar(m).floor(),y=e;if(zJ.bindFramebuffer(v.FRAMEBUFFER,f)&&OJ.drawBuffers&&p)zJ.drawBuffers(D,f);if(zJ.viewport(B),zJ.scissor(I),zJ.setScissorTest(y),qJ){let wJ=uJ.get(D.texture);v.framebufferTexture2D(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_CUBE_MAP_POSITIVE_X+j,wJ.__webglTexture,b)}else if(VJ){let wJ=uJ.get(D.texture),vJ=j||0;v.framebufferTextureLayer(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,wJ.__webglTexture,b||0,vJ)}S=-1},this.readRenderTargetPixels=function(D,j,b,p,f,qJ,VJ){if(!(D&&D.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let NJ=uJ.get(D).__webglFramebuffer;if(D.isWebGLCubeRenderTarget&&VJ!==void 0)NJ=NJ[VJ];if(NJ){zJ.bindFramebuffer(v.FRAMEBUFFER,NJ);try{let wJ=D.texture,vJ=wJ.format,kJ=wJ.type;if(vJ!==1023&&KJ.convert(vJ)!==v.getParameter(v.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}let PJ=kJ===1016&&(dJ.has("EXT_color_buffer_half_float")||OJ.isWebGL2&&dJ.has("EXT_color_buffer_float"));if(kJ!==1009&&KJ.convert(kJ)!==v.getParameter(v.IMPLEMENTATION_COLOR_READ_TYPE)&&!(kJ===1015&&(OJ.isWebGL2||dJ.has("OES_texture_float")||dJ.has("WEBGL_color_buffer_float")))&&!PJ){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(j>=0&&j<=D.width-p&&(b>=0&&b<=D.height-f))v.readPixels(j,b,p,f,KJ.convert(vJ),KJ.convert(kJ),qJ)}finally{let wJ=L!==null?uJ.get(L).__webglFramebuffer:null;zJ.bindFramebuffer(v.FRAMEBUFFER,wJ)}}},this.copyFramebufferToTexture=function(D,j,b=0){let p=Math.pow(2,-b),f=Math.floor(j.image.width*p),qJ=Math.floor(j.image.height*p);xJ.setTexture2D(j,0),v.copyTexSubImage2D(v.TEXTURE_2D,b,0,0,D.x,D.y,f,qJ),zJ.unbindTexture()},this.copyTextureToTexture=function(D,j,b,p=0){let f=j.image.width,qJ=j.image.height,VJ=KJ.convert(b.format),NJ=KJ.convert(b.type);if(xJ.setTexture2D(b,0),v.pixelStorei(v.UNPACK_FLIP_Y_WEBGL,b.flipY),v.pixelStorei(v.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),v.pixelStorei(v.UNPACK_ALIGNMENT,b.unpackAlignment),j.isDataTexture)v.texSubImage2D(v.TEXTURE_2D,p,D.x,D.y,f,qJ,VJ,NJ,j.image.data);else if(j.isCompressedTexture)v.compressedTexSubImage2D(v.TEXTURE_2D,p,D.x,D.y,j.mipmaps[0].width,j.mipmaps[0].height,VJ,j.mipmaps[0].data);else v.texSubImage2D(v.TEXTURE_2D,p,D.x,D.y,VJ,NJ,j.image);if(p===0&&b.generateMipmaps)v.generateMipmap(v.TEXTURE_2D);zJ.unbindTexture()},this.copyTextureToTexture3D=function(D,j,b,p,f=0){if(N.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}let qJ=D.max.x-D.min.x+1,VJ=D.max.y-D.min.y+1,NJ=D.max.z-D.min.z+1,wJ=KJ.convert(p.format),vJ=KJ.convert(p.type),kJ;if(p.isData3DTexture)xJ.setTexture3D(p,0),kJ=v.TEXTURE_3D;else if(p.isDataArrayTexture||p.isCompressedArrayTexture)xJ.setTexture2DArray(p,0),kJ=v.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}v.pixelStorei(v.UNPACK_FLIP_Y_WEBGL,p.flipY),v.pixelStorei(v.UNPACK_PREMULTIPLY_ALPHA_WEBGL,p.premultiplyAlpha),v.pixelStorei(v.UNPACK_ALIGNMENT,p.unpackAlignment);let PJ=v.getParameter(v.UNPACK_ROW_LENGTH),q7=v.getParameter(v.UNPACK_IMAGE_HEIGHT),S7=v.getParameter(v.UNPACK_SKIP_PIXELS),N7=v.getParameter(v.UNPACK_SKIP_ROWS),$9=v.getParameter(v.UNPACK_SKIP_IMAGES),W7=b.isCompressedTexture?b.mipmaps[f]:b.image;if(v.pixelStorei(v.UNPACK_ROW_LENGTH,W7.width),v.pixelStorei(v.UNPACK_IMAGE_HEIGHT,W7.height),v.pixelStorei(v.UNPACK_SKIP_PIXELS,D.min.x),v.pixelStorei(v.UNPACK_SKIP_ROWS,D.min.y),v.pixelStorei(v.UNPACK_SKIP_IMAGES,D.min.z),b.isDataTexture||b.isData3DTexture)v.texSubImage3D(kJ,f,j.x,j.y,j.z,qJ,VJ,NJ,wJ,vJ,W7.data);else if(b.isCompressedArrayTexture)console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),v.compressedTexSubImage3D(kJ,f,j.x,j.y,j.z,qJ,VJ,NJ,wJ,W7.data);else v.texSubImage3D(kJ,f,j.x,j.y,j.z,qJ,VJ,NJ,wJ,vJ,W7);if(v.pixelStorei(v.UNPACK_ROW_LENGTH,PJ),v.pixelStorei(v.UNPACK_IMAGE_HEIGHT,q7),v.pixelStorei(v.UNPACK_SKIP_PIXELS,S7),v.pixelStorei(v.UNPACK_SKIP_ROWS,N7),v.pixelStorei(v.UNPACK_SKIP_IMAGES,$9),f===0&&p.generateMipmaps)v.generateMipmap(kJ);zJ.unbindTexture()},this.initTexture=function(D){if(D.isCubeTexture)xJ.setTextureCube(D,0);else if(D.isData3DTexture)xJ.setTexture3D(D,0);else if(D.isDataArrayTexture||D.isCompressedArrayTexture)xJ.setTexture2DArray(D,0);else xJ.setTexture2D(D,0);zJ.unbindTexture()},this.resetState=function(){w=0,k=0,L=null,zJ.reset(),EJ.reset()},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2000}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(J){this._outputColorSpace=J;let $=this.getContext();$.drawingBufferColorSpace=J==="display-p3"?"display-p3":"srgb",$.unpackColorSpace=iJ.workingColorSpace==="display-p3-linear"?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace==="srgb"?3001:3000}set outputEncoding(J){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=J===3001?"srgb":"srgb-linear"}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(J){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=J}}class N5 extends y0{}N5.prototype.isWebGL1Renderer=!0;class h${constructor(J,$=1,Z=1000){this.isFog=!0,this.name="",this.color=new GJ(J),this.near=$,this.far=Z}clone(){return new h$(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class c8 extends $7{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(J,$){if(super.copy(J,$),J.background!==null)this.background=J.background.clone();if(J.environment!==null)this.environment=J.environment.clone();if(J.fog!==null)this.fog=J.fog.clone();if(this.backgroundBlurriness=J.backgroundBlurriness,this.backgroundIntensity=J.backgroundIntensity,J.overrideMaterial!==null)this.overrideMaterial=J.overrideMaterial.clone();return this.matrixAutoUpdate=J.matrixAutoUpdate,this}toJSON(J){let $=super.toJSON(J);if(this.fog!==null)$.object.fog=this.fog.toJSON();if(this.backgroundBlurriness>0)$.object.backgroundBlurriness=this.backgroundBlurriness;if(this.backgroundIntensity!==1)$.object.backgroundIntensity=this.backgroundIntensity;return $}}class x0{constructor(J,$){this.isInterleavedBuffer=!0,this.array=J,this.stride=$,this.count=J!==void 0?J.length/$:0,this.usage=35044,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=n7()}onUploadCallback(){}set needsUpdate(J){if(J===!0)this.version++}get updateRange(){return console.warn("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(J){return this.usage=J,this}addUpdateRange(J,$){this.updateRanges.push({start:J,count:$})}clearUpdateRanges(){this.updateRanges.length=0}copy(J){return this.array=new J.array.constructor(J.array),this.count=J.count,this.stride=J.stride,this.usage=J.usage,this}copyAt(J,$,Z){J*=this.stride,Z*=$.stride;for(let Q=0,W=this.stride;Q<W;Q++)this.array[J+Q]=$.array[Z+Q];return this}set(J,$=0){return this.array.set(J,$),this}clone(J){if(J.arrayBuffers===void 0)J.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=n7();if(J.arrayBuffers[this.array.buffer._uuid]===void 0)J.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer;let $=new this.array.constructor(J.arrayBuffers[this.array.buffer._uuid]),Z=new this.constructor($,this.stride);return Z.setUsage(this.usage),Z}onUpload(J){return this.onUploadCallback=J,this}toJSON(J){if(J.arrayBuffers===void 0)J.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=n7();if(J.arrayBuffers[this.array.buffer._uuid]===void 0)J.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer));return{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}var k7=new T;class b${constructor(J,$,Z,Q=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=J,this.itemSize=$,this.offset=Z,this.normalized=Q}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(J){this.data.needsUpdate=J}applyMatrix4(J){for(let $=0,Z=this.data.count;$<Z;$++)k7.fromBufferAttribute(this,$),k7.applyMatrix4(J),this.setXYZ($,k7.x,k7.y,k7.z);return this}applyNormalMatrix(J){for(let $=0,Z=this.count;$<Z;$++)k7.fromBufferAttribute(this,$),k7.applyNormalMatrix(J),this.setXYZ($,k7.x,k7.y,k7.z);return this}transformDirection(J){for(let $=0,Z=this.count;$<Z;$++)k7.fromBufferAttribute(this,$),k7.transformDirection(J),this.setXYZ($,k7.x,k7.y,k7.z);return this}setX(J,$){if(this.normalized)$=aJ($,this.array);return this.data.array[J*this.data.stride+this.offset]=$,this}setY(J,$){if(this.normalized)$=aJ($,this.array);return this.data.array[J*this.data.stride+this.offset+1]=$,this}setZ(J,$){if(this.normalized)$=aJ($,this.array);return this.data.array[J*this.data.stride+this.offset+2]=$,this}setW(J,$){if(this.normalized)$=aJ($,this.array);return this.data.array[J*this.data.stride+this.offset+3]=$,this}getX(J){let $=this.data.array[J*this.data.stride+this.offset];if(this.normalized)$=t7($,this.array);return $}getY(J){let $=this.data.array[J*this.data.stride+this.offset+1];if(this.normalized)$=t7($,this.array);return $}getZ(J){let $=this.data.array[J*this.data.stride+this.offset+2];if(this.normalized)$=t7($,this.array);return $}getW(J){let $=this.data.array[J*this.data.stride+this.offset+3];if(this.normalized)$=t7($,this.array);return $}setXY(J,$,Z){if(J=J*this.data.stride+this.offset,this.normalized)$=aJ($,this.array),Z=aJ(Z,this.array);return this.data.array[J+0]=$,this.data.array[J+1]=Z,this}setXYZ(J,$,Z,Q){if(J=J*this.data.stride+this.offset,this.normalized)$=aJ($,this.array),Z=aJ(Z,this.array),Q=aJ(Q,this.array);return this.data.array[J+0]=$,this.data.array[J+1]=Z,this.data.array[J+2]=Q,this}setXYZW(J,$,Z,Q,W){if(J=J*this.data.stride+this.offset,this.normalized)$=aJ($,this.array),Z=aJ(Z,this.array),Q=aJ(Q,this.array),W=aJ(W,this.array);return this.data.array[J+0]=$,this.data.array[J+1]=Z,this.data.array[J+2]=Q,this.data.array[J+3]=W,this}clone(J){if(J===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let $=[];for(let Z=0;Z<this.count;Z++){let Q=Z*this.data.stride+this.offset;for(let W=0;W<this.itemSize;W++)$.push(this.data.array[Q+W])}return new Z7(new this.array.constructor($),this.itemSize,this.normalized)}else{if(J.interleavedBuffers===void 0)J.interleavedBuffers={};if(J.interleavedBuffers[this.data.uuid]===void 0)J.interleavedBuffers[this.data.uuid]=this.data.clone(J);return new b$(J.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}}toJSON(J){if(J===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let $=[];for(let Z=0;Z<this.count;Z++){let Q=Z*this.data.stride+this.offset;for(let W=0;W<this.itemSize;W++)$.push(this.data.array[Q+W])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:$,normalized:this.normalized}}else{if(J.interleavedBuffers===void 0)J.interleavedBuffers={};if(J.interleavedBuffers[this.data.uuid]===void 0)J.interleavedBuffers[this.data.uuid]=this.data.toJSON(J);return{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}}var MZ=new T,BZ=new J7,DZ=new J7,lH=new T,LZ=new AJ,D0=new T,D8=new g7,CZ=new AJ,L8=new x$;class n8 extends H7{constructor(J,$){super(J,$);this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new AJ,this.bindMatrixInverse=new AJ,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let J=this.geometry;if(this.boundingBox===null)this.boundingBox=new y7;this.boundingBox.makeEmpty();let $=J.getAttribute("position");for(let Z=0;Z<$.count;Z++)this.getVertexPosition(Z,D0),this.boundingBox.expandByPoint(D0)}computeBoundingSphere(){let J=this.geometry;if(this.boundingSphere===null)this.boundingSphere=new g7;this.boundingSphere.makeEmpty();let $=J.getAttribute("position");for(let Z=0;Z<$.count;Z++)this.getVertexPosition(Z,D0),this.boundingSphere.expandByPoint(D0)}copy(J,$){if(super.copy(J,$),this.bindMode=J.bindMode,this.bindMatrix.copy(J.bindMatrix),this.bindMatrixInverse.copy(J.bindMatrixInverse),this.skeleton=J.skeleton,J.boundingBox!==null)this.boundingBox=J.boundingBox.clone();if(J.boundingSphere!==null)this.boundingSphere=J.boundingSphere.clone();return this}raycast(J,$){let Z=this.material,Q=this.matrixWorld;if(Z===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(D8.copy(this.boundingSphere),D8.applyMatrix4(Q),J.ray.intersectsSphere(D8)===!1)return;if(CZ.copy(Q).invert(),L8.copy(J.ray).applyMatrix4(CZ),this.boundingBox!==null){if(L8.intersectsBox(this.boundingBox)===!1)return}this._computeIntersections(J,$,L8)}getVertexPosition(J,$){return super.getVertexPosition(J,$),this.applyBoneTransform(J,$),$}bind(J,$){if(this.skeleton=J,$===void 0)this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),$=this.matrixWorld;this.bindMatrix.copy($),this.bindMatrixInverse.copy($).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let J=new J7,$=this.geometry.attributes.skinWeight;for(let Z=0,Q=$.count;Z<Q;Z++){J.fromBufferAttribute($,Z);let W=1/J.manhattanLength();if(W!==1/0)J.multiplyScalar(W);else J.set(1,0,0,0);$.setXYZW(Z,J.x,J.y,J.z,J.w)}}updateMatrixWorld(J){if(super.updateMatrixWorld(J),this.bindMode==="attached")this.bindMatrixInverse.copy(this.matrixWorld).invert();else if(this.bindMode==="detached")this.bindMatrixInverse.copy(this.bindMatrix).invert();else console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(J,$){let Z=this.skeleton,Q=this.geometry;BZ.fromBufferAttribute(Q.attributes.skinIndex,J),DZ.fromBufferAttribute(Q.attributes.skinWeight,J),MZ.copy($).applyMatrix4(this.bindMatrix),$.set(0,0,0);for(let W=0;W<4;W++){let X=DZ.getComponent(W);if(X!==0){let H=BZ.getComponent(W);LZ.multiplyMatrices(Z.bones[H].matrixWorld,Z.boneInverses[H]),$.addScaledVector(lH.copy(MZ).applyMatrix4(LZ),X)}}return $.applyMatrix4(this.bindMatrixInverse)}boneTransform(J,$){return console.warn("THREE.SkinnedMesh: .boneTransform() was renamed to .applyBoneTransform() in r151."),this.applyBoneTransform(J,$)}}class f0 extends $7{constructor(){super();this.isBone=!0,this.type="Bone"}}class z5 extends O7{constructor(J=null,$=1,Z=1,Q,W,X,H,Y,q=1003,U=1003,K,E){super(null,X,H,Y,q,U,Q,W,K,E);this.isDataTexture=!0,this.image={data:J,width:$,height:Z},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}var wZ=new AJ,uH=new AJ;class h0{constructor(J=[],$=[]){this.uuid=n7(),this.bones=J.slice(0),this.boneInverses=$,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let J=this.bones,$=this.boneInverses;if(this.boneMatrices=new Float32Array(J.length*16),$.length===0)this.calculateInverses();else if(J.length!==$.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let Z=0,Q=this.bones.length;Z<Q;Z++)this.boneInverses.push(new AJ)}}calculateInverses(){this.boneInverses.length=0;for(let J=0,$=this.bones.length;J<$;J++){let Z=new AJ;if(this.bones[J])Z.copy(this.bones[J].matrixWorld).invert();this.boneInverses.push(Z)}}pose(){for(let J=0,$=this.bones.length;J<$;J++){let Z=this.bones[J];if(Z)Z.matrixWorld.copy(this.boneInverses[J]).invert()}for(let J=0,$=this.bones.length;J<$;J++){let Z=this.bones[J];if(Z){if(Z.parent&&Z.parent.isBone)Z.matrix.copy(Z.parent.matrixWorld).invert(),Z.matrix.multiply(Z.matrixWorld);else Z.matrix.copy(Z.matrixWorld);Z.matrix.decompose(Z.position,Z.quaternion,Z.scale)}}}update(){let J=this.bones,$=this.boneInverses,Z=this.boneMatrices,Q=this.boneTexture;for(let W=0,X=J.length;W<X;W++){let H=J[W]?J[W].matrixWorld:uH;wZ.multiplyMatrices(H,$[W]),wZ.toArray(Z,W*16)}if(Q!==null)Q.needsUpdate=!0}clone(){return new h0(this.bones,this.boneInverses)}computeBoneTexture(){let J=Math.sqrt(this.bones.length*4);J=Math.ceil(J/4)*4,J=Math.max(J,4);let $=new Float32Array(J*J*4);$.set(this.boneMatrices);let Z=new z5($,J,J,1023,1015);return Z.needsUpdate=!0,this.boneMatrices=$,this.boneTexture=Z,this}getBoneByName(J){for(let $=0,Z=this.bones.length;$<Z;$++){let Q=this.bones[$];if(Q.name===J)return Q}return}dispose(){if(this.boneTexture!==null)this.boneTexture.dispose(),this.boneTexture=null}fromJSON(J,$){this.uuid=J.uuid;for(let Z=0,Q=J.bones.length;Z<Q;Z++){let W=J.bones[Z],X=$[W];if(X===void 0)console.warn("THREE.Skeleton: No bone found with UUID:",W),X=new f0;this.bones.push(X),this.boneInverses.push(new AJ().fromArray(J.boneInverses[Z]))}return this.init(),this}toJSON(){let J={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};J.uuid=this.uuid;let $=this.bones,Z=this.boneInverses;for(let Q=0,W=$.length;Q<W;Q++){let X=$[Q];J.bones.push(X.uuid);let H=Z[Q];J.boneInverses.push(H.toArray())}return J}}class H$ extends Z7{constructor(J,$,Z,Q=1){super(J,$,Z);this.isInstancedBufferAttribute=!0,this.meshPerAttribute=Q}copy(J){return super.copy(J),this.meshPerAttribute=J.meshPerAttribute,this}toJSON(){let J=super.toJSON();return J.meshPerAttribute=this.meshPerAttribute,J.isInstancedBufferAttribute=!0,J}}var $$=new AJ,IZ=new AJ,L0=[],kZ=new y7,mH=new AJ,L$=new H7,C$=new g7;class g$ extends H7{constructor(J,$,Z){super(J,$);this.isInstancedMesh=!0,this.instanceMatrix=new H$(new Float32Array(Z*16),16),this.instanceColor=null,this.count=Z,this.boundingBox=null,this.boundingSphere=null;for(let Q=0;Q<Z;Q++)this.setMatrixAt(Q,mH)}computeBoundingBox(){let J=this.geometry,$=this.count;if(this.boundingBox===null)this.boundingBox=new y7;if(J.boundingBox===null)J.computeBoundingBox();this.boundingBox.makeEmpty();for(let Z=0;Z<$;Z++)this.getMatrixAt(Z,$$),kZ.copy(J.boundingBox).applyMatrix4($$),this.boundingBox.union(kZ)}computeBoundingSphere(){let J=this.geometry,$=this.count;if(this.boundingSphere===null)this.boundingSphere=new g7;if(J.boundingSphere===null)J.computeBoundingSphere();this.boundingSphere.makeEmpty();for(let Z=0;Z<$;Z++)this.getMatrixAt(Z,$$),C$.copy(J.boundingSphere).applyMatrix4($$),this.boundingSphere.union(C$)}copy(J,$){if(super.copy(J,$),this.instanceMatrix.copy(J.instanceMatrix),J.instanceColor!==null)this.instanceColor=J.instanceColor.clone();if(this.count=J.count,J.boundingBox!==null)this.boundingBox=J.boundingBox.clone();if(J.boundingSphere!==null)this.boundingSphere=J.boundingSphere.clone();return this}getColorAt(J,$){$.fromArray(this.instanceColor.array,J*3)}getMatrixAt(J,$){$.fromArray(this.instanceMatrix.array,J*16)}raycast(J,$){let Z=this.matrixWorld,Q=this.count;if(L$.geometry=this.geometry,L$.material=this.material,L$.material===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(C$.copy(this.boundingSphere),C$.applyMatrix4(Z),J.ray.intersectsSphere(C$)===!1)return;for(let W=0;W<Q;W++){this.getMatrixAt(W,$$),IZ.multiplyMatrices(Z,$$),L$.matrixWorld=IZ,L$.raycast(J,L0);for(let X=0,H=L0.length;X<H;X++){let Y=L0[X];Y.instanceId=W,Y.object=this,$.push(Y)}L0.length=0}}setColorAt(J,$){if(this.instanceColor===null)this.instanceColor=new H$(new Float32Array(this.instanceMatrix.count*3),3);$.toArray(this.instanceColor.array,J*3)}setMatrixAt(J,$){$.toArray(this.instanceMatrix.array,J*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class b0 extends x7{constructor(J){super();this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new GJ(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.linewidth=J.linewidth,this.linecap=J.linecap,this.linejoin=J.linejoin,this.fog=J.fog,this}}var PZ=new T,AZ=new T,TZ=new AJ,C8=new x$,C0=new g7;class p$ extends $7{constructor(J=new E7,$=new b0){super();this.isLine=!0,this.type="Line",this.geometry=J,this.material=$,this.updateMorphTargets()}copy(J,$){return super.copy(J,$),this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}computeLineDistances(){let J=this.geometry;if(J.index===null){let $=J.attributes.position,Z=[0];for(let Q=1,W=$.count;Q<W;Q++)PZ.fromBufferAttribute($,Q-1),AZ.fromBufferAttribute($,Q),Z[Q]=Z[Q-1],Z[Q]+=PZ.distanceTo(AZ);J.setAttribute("lineDistance",new X7(Z,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(J,$){let Z=this.geometry,Q=this.matrixWorld,W=J.params.Line.threshold,X=Z.drawRange;if(Z.boundingSphere===null)Z.computeBoundingSphere();if(C0.copy(Z.boundingSphere),C0.applyMatrix4(Q),C0.radius+=W,J.ray.intersectsSphere(C0)===!1)return;TZ.copy(Q).invert(),C8.copy(J.ray).applyMatrix4(TZ);let H=W/((this.scale.x+this.scale.y+this.scale.z)/3),Y=H*H,q=new T,U=new T,K=new T,E=new T,V=this.isLineSegments?2:1,O=Z.index,R=Z.attributes.position;if(O!==null){let F=Math.max(0,X.start),G=Math.min(O.count,X.start+X.count);for(let N=F,z=G-1;N<z;N+=V){let w=O.getX(N),k=O.getX(N+1);if(q.fromBufferAttribute(R,w),U.fromBufferAttribute(R,k),C8.distanceSqToSegment(q,U,E,K)>Y)continue;E.applyMatrix4(this.matrixWorld);let S=J.ray.origin.distanceTo(E);if(S<J.near||S>J.far)continue;$.push({distance:S,point:K.clone().applyMatrix4(this.matrixWorld),index:N,face:null,faceIndex:null,object:this})}}else{let F=Math.max(0,X.start),G=Math.min(R.count,X.start+X.count);for(let N=F,z=G-1;N<z;N+=V){if(q.fromBufferAttribute(R,N),U.fromBufferAttribute(R,N+1),C8.distanceSqToSegment(q,U,E,K)>Y)continue;E.applyMatrix4(this.matrixWorld);let k=J.ray.origin.distanceTo(E);if(k<J.near||k>J.far)continue;$.push({distance:k,point:K.clone().applyMatrix4(this.matrixWorld),index:N,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){let $=this.geometry.morphAttributes,Z=Object.keys($);if(Z.length>0){let Q=$[Z[0]];if(Q!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let W=0,X=Q.length;W<X;W++){let H=Q[W].name||String(W);this.morphTargetInfluences.push(0),this.morphTargetDictionary[H]=W}}}}}var SZ=new T,jZ=new T;class s8 extends p${constructor(J,$){super(J,$);this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let J=this.geometry;if(J.index===null){let $=J.attributes.position,Z=[];for(let Q=0,W=$.count;Q<W;Q+=2)SZ.fromBufferAttribute($,Q),jZ.fromBufferAttribute($,Q+1),Z[Q]=Q===0?0:Z[Q-1],Z[Q+1]=Z[Q]+SZ.distanceTo(jZ);J.setAttribute("lineDistance",new X7(Z,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class i8 extends p${constructor(J,$){super(J,$);this.isLineLoop=!0,this.type="LineLoop"}}class E$ extends x7{constructor(J){super();this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new GJ(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.alphaMap=J.alphaMap,this.size=J.size,this.sizeAttenuation=J.sizeAttenuation,this.fog=J.fog,this}}var vZ=new AJ,T8=new x$,w0=new g7,I0=new T;class l$ extends $7{constructor(J=new E7,$=new E$){super();this.isPoints=!0,this.type="Points",this.geometry=J,this.material=$,this.updateMorphTargets()}copy(J,$){return super.copy(J,$),this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}raycast(J,$){let Z=this.geometry,Q=this.matrixWorld,W=J.params.Points.threshold,X=Z.drawRange;if(Z.boundingSphere===null)Z.computeBoundingSphere();if(w0.copy(Z.boundingSphere),w0.applyMatrix4(Q),w0.radius+=W,J.ray.intersectsSphere(w0)===!1)return;vZ.copy(Q).invert(),T8.copy(J.ray).applyMatrix4(vZ);let H=W/((this.scale.x+this.scale.y+this.scale.z)/3),Y=H*H,q=Z.index,K=Z.attributes.position;if(q!==null){let E=Math.max(0,X.start),V=Math.min(q.count,X.start+X.count);for(let O=E,_=V;O<_;O++){let R=q.getX(O);I0.fromBufferAttribute(K,R),yZ(I0,R,Y,Q,J,$,this)}}else{let E=Math.max(0,X.start),V=Math.min(K.count,X.start+X.count);for(let O=E,_=V;O<_;O++)I0.fromBufferAttribute(K,O),yZ(I0,O,Y,Q,J,$,this)}}updateMorphTargets(){let $=this.geometry.morphAttributes,Z=Object.keys($);if(Z.length>0){let Q=$[Z[0]];if(Q!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let W=0,X=Q.length;W<X;W++){let H=Q[W].name||String(W);this.morphTargetInfluences.push(0),this.morphTargetDictionary[H]=W}}}}}function yZ(J,$,Z,Q,W,X,H){let Y=T8.distanceSqToPoint(J);if(Y<Z){let q=new T;T8.closestPointToPoint(J,q),q.applyMatrix4(Q);let U=W.ray.origin.distanceTo(q);if(U<W.near||U>W.far)return;X.push({distance:U,distanceToRay:Math.sqrt(Y),point:q,index:$,face:null,object:H})}}class g0 extends O7{constructor(J,$,Z,Q,W,X,H,Y,q){super(J,$,Z,Q,W,X,H,Y,q);this.isCanvasTexture=!0,this.needsUpdate=!0}}class p0 extends E7{constructor(J=1,$=32,Z=0,Q=Math.PI*2){super();this.type="CircleGeometry",this.parameters={radius:J,segments:$,thetaStart:Z,thetaLength:Q},$=Math.max(3,$);let W=[],X=[],H=[],Y=[],q=new T,U=new yJ;X.push(0,0,0),H.push(0,0,1),Y.push(0.5,0.5);for(let K=0,E=3;K<=$;K++,E+=3){let V=Z+K/$*Q;q.x=J*Math.cos(V),q.y=J*Math.sin(V),X.push(q.x,q.y,q.z),H.push(0,0,1),U.x=(X[E]/J+1)/2,U.y=(X[E+1]/J+1)/2,Y.push(U.x,U.y)}for(let K=1;K<=$;K++)W.push(K,K+1,0);this.setIndex(W),this.setAttribute("position",new X7(X,3)),this.setAttribute("normal",new X7(H,3)),this.setAttribute("uv",new X7(Y,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new p0(J.radius,J.segments,J.thetaStart,J.thetaLength)}}class u$ extends E7{constructor(J=1,$=1,Z=1,Q=32,W=1,X=!1,H=0,Y=Math.PI*2){super();this.type="CylinderGeometry",this.parameters={radiusTop:J,radiusBottom:$,height:Z,radialSegments:Q,heightSegments:W,openEnded:X,thetaStart:H,thetaLength:Y};let q=this;Q=Math.floor(Q),W=Math.floor(W);let U=[],K=[],E=[],V=[],O=0,_=[],R=Z/2,F=0;if(G(),X===!1){if(J>0)N(!0);if($>0)N(!1)}this.setIndex(U),this.setAttribute("position",new X7(K,3)),this.setAttribute("normal",new X7(E,3)),this.setAttribute("uv",new X7(V,2));function G(){let z=new T,w=new T,k=0,L=($-J)/Z;for(let S=0;S<=W;S++){let g=[],B=S/W,I=B*($-J)+J;for(let y=0;y<=Q;y++){let c=y/Q,ZJ=c*Y+H,A=Math.sin(ZJ),l=Math.cos(ZJ);w.x=I*A,w.y=-B*Z+R,w.z=I*l,K.push(w.x,w.y,w.z),z.set(A,L,l).normalize(),E.push(z.x,z.y,z.z),V.push(c,1-B),g.push(O++)}_.push(g)}for(let S=0;S<Q;S++)for(let g=0;g<W;g++){let B=_[g][S],I=_[g+1][S],y=_[g+1][S+1],c=_[g][S+1];U.push(B,I,c),U.push(I,y,c),k+=6}q.addGroup(F,k,0),F+=k}function N(z){let w=O,k=new yJ,L=new T,S=0,g=z===!0?J:$,B=z===!0?1:-1;for(let y=1;y<=Q;y++)K.push(0,R*B,0),E.push(0,B,0),V.push(0.5,0.5),O++;let I=O;for(let y=0;y<=Q;y++){let ZJ=y/Q*Y+H,A=Math.cos(ZJ),l=Math.sin(ZJ);L.x=g*l,L.y=R*B,L.z=g*A,K.push(L.x,L.y,L.z),E.push(0,B,0),k.x=A*0.5+0.5,k.y=l*0.5*B+0.5,V.push(k.x,k.y),O++}for(let y=0;y<Q;y++){let c=w+y,ZJ=I+y;if(z===!0)U.push(ZJ,ZJ+1,c);else U.push(ZJ+1,ZJ,c);S+=3}q.addGroup(F,S,z===!0?1:2),F+=S}}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new u$(J.radiusTop,J.radiusBottom,J.height,J.radialSegments,J.heightSegments,J.openEnded,J.thetaStart,J.thetaLength)}}class m$ extends E7{constructor(J=1,$=32,Z=16,Q=0,W=Math.PI*2,X=0,H=Math.PI){super();this.type="SphereGeometry",this.parameters={radius:J,widthSegments:$,heightSegments:Z,phiStart:Q,phiLength:W,thetaStart:X,thetaLength:H},$=Math.max(3,Math.floor($)),Z=Math.max(2,Math.floor(Z));let Y=Math.min(X+H,Math.PI),q=0,U=[],K=new T,E=new T,V=[],O=[],_=[],R=[];for(let F=0;F<=Z;F++){let G=[],N=F/Z,z=0;if(F===0&&X===0)z=0.5/$;else if(F===Z&&Y===Math.PI)z=-0.5/$;for(let w=0;w<=$;w++){let k=w/$;K.x=-J*Math.cos(Q+k*W)*Math.sin(X+N*H),K.y=J*Math.cos(X+N*H),K.z=J*Math.sin(Q+k*W)*Math.sin(X+N*H),O.push(K.x,K.y,K.z),E.copy(K).normalize(),_.push(E.x,E.y,E.z),R.push(k+z,1-N),G.push(q++)}U.push(G)}for(let F=0;F<Z;F++)for(let G=0;G<$;G++){let N=U[F][G+1],z=U[F][G],w=U[F+1][G],k=U[F+1][G+1];if(F!==0||X>0)V.push(N,z,k);if(F!==Z-1||Y<Math.PI)V.push(z,w,k)}this.setIndex(V),this.setAttribute("position",new X7(O,3)),this.setAttribute("normal",new X7(_,3)),this.setAttribute("uv",new X7(R,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new m$(J.radius,J.widthSegments,J.heightSegments,J.phiStart,J.phiLength,J.thetaStart,J.thetaLength)}}class l0 extends E7{constructor(J=1,$=0.4,Z=12,Q=48,W=Math.PI*2){super();this.type="TorusGeometry",this.parameters={radius:J,tube:$,radialSegments:Z,tubularSegments:Q,arc:W},Z=Math.floor(Z),Q=Math.floor(Q);let X=[],H=[],Y=[],q=[],U=new T,K=new T,E=new T;for(let V=0;V<=Z;V++)for(let O=0;O<=Q;O++){let _=O/Q*W,R=V/Z*Math.PI*2;K.x=(J+$*Math.cos(R))*Math.cos(_),K.y=(J+$*Math.cos(R))*Math.sin(_),K.z=$*Math.sin(R),H.push(K.x,K.y,K.z),U.x=J*Math.cos(_),U.y=J*Math.sin(_),E.subVectors(K,U).normalize(),Y.push(E.x,E.y,E.z),q.push(O/Q),q.push(V/Z)}for(let V=1;V<=Z;V++)for(let O=1;O<=Q;O++){let _=(Q+1)*V+O-1,R=(Q+1)*(V-1)+O-1,F=(Q+1)*(V-1)+O,G=(Q+1)*V+O;X.push(_,R,G),X.push(R,F,G)}this.setIndex(X),this.setAttribute("position",new X7(H,3)),this.setAttribute("normal",new X7(Y,3)),this.setAttribute("uv",new X7(q,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new l0(J.radius,J.tube,J.radialSegments,J.tubularSegments,J.arc)}}class d$ extends x7{constructor(J){super();this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new GJ(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new GJ(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new yJ(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.defines={STANDARD:""},this.color.copy(J.color),this.roughness=J.roughness,this.metalness=J.metalness,this.map=J.map,this.lightMap=J.lightMap,this.lightMapIntensity=J.lightMapIntensity,this.aoMap=J.aoMap,this.aoMapIntensity=J.aoMapIntensity,this.emissive.copy(J.emissive),this.emissiveMap=J.emissiveMap,this.emissiveIntensity=J.emissiveIntensity,this.bumpMap=J.bumpMap,this.bumpScale=J.bumpScale,this.normalMap=J.normalMap,this.normalMapType=J.normalMapType,this.normalScale.copy(J.normalScale),this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this.roughnessMap=J.roughnessMap,this.metalnessMap=J.metalnessMap,this.alphaMap=J.alphaMap,this.envMap=J.envMap,this.envMapIntensity=J.envMapIntensity,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.wireframeLinecap=J.wireframeLinecap,this.wireframeLinejoin=J.wireframeLinejoin,this.flatShading=J.flatShading,this.fog=J.fog,this}}class s7 extends d${constructor(J){super();this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new yJ(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return C7(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function($){this.ior=(1+0.4*$)/(1-0.4*$)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new GJ(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new GJ(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new GJ(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(J)}get anisotropy(){return this._anisotropy}set anisotropy(J){if(this._anisotropy>0!==J>0)this.version++;this._anisotropy=J}get clearcoat(){return this._clearcoat}set clearcoat(J){if(this._clearcoat>0!==J>0)this.version++;this._clearcoat=J}get iridescence(){return this._iridescence}set iridescence(J){if(this._iridescence>0!==J>0)this.version++;this._iridescence=J}get sheen(){return this._sheen}set sheen(J){if(this._sheen>0!==J>0)this.version++;this._sheen=J}get transmission(){return this._transmission}set transmission(J){if(this._transmission>0!==J>0)this.version++;this._transmission=J}copy(J){return super.copy(J),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=J.anisotropy,this.anisotropyRotation=J.anisotropyRotation,this.anisotropyMap=J.anisotropyMap,this.clearcoat=J.clearcoat,this.clearcoatMap=J.clearcoatMap,this.clearcoatRoughness=J.clearcoatRoughness,this.clearcoatRoughnessMap=J.clearcoatRoughnessMap,this.clearcoatNormalMap=J.clearcoatNormalMap,this.clearcoatNormalScale.copy(J.clearcoatNormalScale),this.ior=J.ior,this.iridescence=J.iridescence,this.iridescenceMap=J.iridescenceMap,this.iridescenceIOR=J.iridescenceIOR,this.iridescenceThicknessRange=[...J.iridescenceThicknessRange],this.iridescenceThicknessMap=J.iridescenceThicknessMap,this.sheen=J.sheen,this.sheenColor.copy(J.sheenColor),this.sheenColorMap=J.sheenColorMap,this.sheenRoughness=J.sheenRoughness,this.sheenRoughnessMap=J.sheenRoughnessMap,this.transmission=J.transmission,this.transmissionMap=J.transmissionMap,this.thickness=J.thickness,this.thicknessMap=J.thicknessMap,this.attenuationDistance=J.attenuationDistance,this.attenuationColor.copy(J.attenuationColor),this.specularIntensity=J.specularIntensity,this.specularIntensityMap=J.specularIntensityMap,this.specularColor.copy(J.specularColor),this.specularColorMap=J.specularColorMap,this}}class y9 extends x7{constructor(J){super();this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new GJ(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new GJ(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new yJ(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.lightMap=J.lightMap,this.lightMapIntensity=J.lightMapIntensity,this.aoMap=J.aoMap,this.aoMapIntensity=J.aoMapIntensity,this.emissive.copy(J.emissive),this.emissiveMap=J.emissiveMap,this.emissiveIntensity=J.emissiveIntensity,this.bumpMap=J.bumpMap,this.bumpScale=J.bumpScale,this.normalMap=J.normalMap,this.normalMapType=J.normalMapType,this.normalScale.copy(J.normalScale),this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this.specularMap=J.specularMap,this.alphaMap=J.alphaMap,this.envMap=J.envMap,this.combine=J.combine,this.reflectivity=J.reflectivity,this.refractionRatio=J.refractionRatio,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.wireframeLinecap=J.wireframeLinecap,this.wireframeLinejoin=J.wireframeLinejoin,this.flatShading=J.flatShading,this.fog=J.fog,this}}function k0(J,$,Z){if(!J||!Z&&J.constructor===$)return J;if(typeof $.BYTES_PER_ELEMENT==="number")return new $(J);return Array.prototype.slice.call(J)}function dH(J){return ArrayBuffer.isView(J)&&!(J instanceof DataView)}function cH(J){function $(W,X){return J[W]-J[X]}let Z=J.length,Q=Array(Z);for(let W=0;W!==Z;++W)Q[W]=W;return Q.sort($),Q}function xZ(J,$,Z){let Q=J.length,W=new J.constructor(Q);for(let X=0,H=0;H!==Q;++X){let Y=Z[X]*$;for(let q=0;q!==$;++q)W[H++]=J[Y+q]}return W}function M5(J,$,Z,Q){let W=1,X=J[0];while(X!==void 0&&X[Q]===void 0)X=J[W++];if(X===void 0)return;let H=X[Q];if(H===void 0)return;if(Array.isArray(H))do{if(H=X[Q],H!==void 0)$.push(X.time),Z.push.apply(Z,H);X=J[W++]}while(X!==void 0);else if(H.toArray!==void 0)do{if(H=X[Q],H!==void 0)$.push(X.time),H.toArray(Z,Z.length);X=J[W++]}while(X!==void 0);else do{if(H=X[Q],H!==void 0)$.push(X.time),Z.push(H);X=J[W++]}while(X!==void 0)}class x9{constructor(J,$,Z,Q){this.parameterPositions=J,this._cachedIndex=0,this.resultBuffer=Q!==void 0?Q:new $.constructor(Z),this.sampleValues=$,this.valueSize=Z,this.settings=null,this.DefaultSettings_={}}evaluate(J){let $=this.parameterPositions,Z=this._cachedIndex,Q=$[Z],W=$[Z-1];J:{$:{let X;Z:{Q:if(!(J<Q)){for(let H=Z+2;;){if(Q===void 0){if(J<W)break Q;return Z=$.length,this._cachedIndex=Z,this.copySampleValue_(Z-1)}if(Z===H)break;if(W=Q,Q=$[++Z],J<Q)break $}X=$.length;break Z}if(!(J>=W)){let H=$[1];if(J<H)Z=2,W=H;for(let Y=Z-2;;){if(W===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(Z===Y)break;if(Q=W,W=$[--Z-1],J>=W)break $}X=Z,Z=0;break Z}break J}while(Z<X){let H=Z+X>>>1;if(J<$[H])X=H;else Z=H+1}if(Q=$[Z],W=$[Z-1],W===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(Q===void 0)return Z=$.length,this._cachedIndex=Z,this.copySampleValue_(Z-1)}this._cachedIndex=Z,this.intervalChanged_(Z,W,Q)}return this.interpolate_(Z,W,J,Q)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(J){let $=this.resultBuffer,Z=this.sampleValues,Q=this.valueSize,W=J*Q;for(let X=0;X!==Q;++X)$[X]=Z[W+X];return $}interpolate_(){throw Error("call to abstract method")}intervalChanged_(){}}class B5 extends x9{constructor(J,$,Z,Q){super(J,$,Z,Q);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(J,$,Z){let Q=this.parameterPositions,W=J-2,X=J+1,H=Q[W],Y=Q[X];if(H===void 0)switch(this.getSettings_().endingStart){case 2401:W=J,H=2*$-Z;break;case 2402:W=Q.length-2,H=$+Q[W]-Q[W+1];break;default:W=J,H=Z}if(Y===void 0)switch(this.getSettings_().endingEnd){case 2401:X=J,Y=2*Z-$;break;case 2402:X=1,Y=Z+Q[1]-Q[0];break;default:X=J-1,Y=$}let q=(Z-$)*0.5,U=this.valueSize;this._weightPrev=q/($-H),this._weightNext=q/(Y-Z),this._offsetPrev=W*U,this._offsetNext=X*U}interpolate_(J,$,Z,Q){let W=this.resultBuffer,X=this.sampleValues,H=this.valueSize,Y=J*H,q=Y-H,U=this._offsetPrev,K=this._offsetNext,E=this._weightPrev,V=this._weightNext,O=(Z-$)/(Q-$),_=O*O,R=_*O,F=-E*R+2*E*_-E*O,G=(1+E)*R+(-1.5-2*E)*_+(-0.5+E)*O+1,N=(-1-V)*R+(1.5+V)*_+0.5*O,z=V*R-V*_;for(let w=0;w!==H;++w)W[w]=F*X[U+w]+G*X[q+w]+N*X[Y+w]+z*X[K+w];return W}}class o8 extends x9{constructor(J,$,Z,Q){super(J,$,Z,Q)}interpolate_(J,$,Z,Q){let W=this.resultBuffer,X=this.sampleValues,H=this.valueSize,Y=J*H,q=Y-H,U=(Z-$)/(Q-$),K=1-U;for(let E=0;E!==H;++E)W[E]=X[q+E]*K+X[Y+E]*U;return W}}class D5 extends x9{constructor(J,$,Z,Q){super(J,$,Z,Q)}interpolate_(J){return this.copySampleValue_(J-1)}}class i7{constructor(J,$,Z,Q){if(J===void 0)throw Error("THREE.KeyframeTrack: track name is undefined");if($===void 0||$.length===0)throw Error("THREE.KeyframeTrack: no keyframes in track named "+J);this.name=J,this.times=k0($,this.TimeBufferType),this.values=k0(Z,this.ValueBufferType),this.setInterpolation(Q||this.DefaultInterpolation)}static toJSON(J){let $=J.constructor,Z;if($.toJSON!==this.toJSON)Z=$.toJSON(J);else{Z={name:J.name,times:k0(J.times,Array),values:k0(J.values,Array)};let Q=J.getInterpolation();if(Q!==J.DefaultInterpolation)Z.interpolation=Q}return Z.type=J.ValueTypeName,Z}InterpolantFactoryMethodDiscrete(J){return new D5(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodLinear(J){return new o8(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodSmooth(J){return new B5(this.times,this.values,this.getValueSize(),J)}setInterpolation(J){let $;switch(J){case 2300:$=this.InterpolantFactoryMethodDiscrete;break;case 2301:$=this.InterpolantFactoryMethodLinear;break;case 2302:$=this.InterpolantFactoryMethodSmooth;break}if($===void 0){let Z="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(J!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(Z);return console.warn("THREE.KeyframeTrack:",Z),this}return this.createInterpolant=$,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302}}getValueSize(){return this.values.length/this.times.length}shift(J){if(J!==0){let $=this.times;for(let Z=0,Q=$.length;Z!==Q;++Z)$[Z]+=J}return this}scale(J){if(J!==1){let $=this.times;for(let Z=0,Q=$.length;Z!==Q;++Z)$[Z]*=J}return this}trim(J,$){let Z=this.times,Q=Z.length,W=0,X=Q-1;while(W!==Q&&Z[W]<J)++W;while(X!==-1&&Z[X]>$)--X;if(++X,W!==0||X!==Q){if(W>=X)X=Math.max(X,1),W=X-1;let H=this.getValueSize();this.times=Z.slice(W,X),this.values=this.values.slice(W*H,X*H)}return this}validate(){let J=!0,$=this.getValueSize();if($-Math.floor($)!==0)console.error("THREE.KeyframeTrack: Invalid value size in track.",this),J=!1;let Z=this.times,Q=this.values,W=Z.length;if(W===0)console.error("THREE.KeyframeTrack: Track is empty.",this),J=!1;let X=null;for(let H=0;H!==W;H++){let Y=Z[H];if(typeof Y==="number"&&isNaN(Y)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,H,Y),J=!1;break}if(X!==null&&X>Y){console.error("THREE.KeyframeTrack: Out of order keys.",this,H,Y,X),J=!1;break}X=Y}if(Q!==void 0){if(dH(Q))for(let H=0,Y=Q.length;H!==Y;++H){let q=Q[H];if(isNaN(q)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,H,q),J=!1;break}}}return J}optimize(){let J=this.times.slice(),$=this.values.slice(),Z=this.getValueSize(),Q=this.getInterpolation()===2302,W=J.length-1,X=1;for(let H=1;H<W;++H){let Y=!1,q=J[H],U=J[H+1];if(q!==U&&(H!==1||q!==J[0]))if(!Q){let K=H*Z,E=K-Z,V=K+Z;for(let O=0;O!==Z;++O){let _=$[K+O];if(_!==$[E+O]||_!==$[V+O]){Y=!0;break}}}else Y=!0;if(Y){if(H!==X){J[X]=J[H];let K=H*Z,E=X*Z;for(let V=0;V!==Z;++V)$[E+V]=$[K+V]}++X}}if(W>0){J[X]=J[W];for(let H=W*Z,Y=X*Z,q=0;q!==Z;++q)$[Y+q]=$[H+q];++X}if(X!==J.length)this.times=J.slice(0,X),this.values=$.slice(0,X*Z);else this.times=J,this.values=$;return this}clone(){let J=this.times.slice(),$=this.values.slice(),Q=new this.constructor(this.name,J,$);return Q.createInterpolant=this.createInterpolant,Q}}i7.prototype.TimeBufferType=Float32Array;i7.prototype.ValueBufferType=Float32Array;i7.prototype.DefaultInterpolation=2301;class f9 extends i7{}f9.prototype.ValueTypeName="bool";f9.prototype.ValueBufferType=Array;f9.prototype.DefaultInterpolation=2300;f9.prototype.InterpolantFactoryMethodLinear=void 0;f9.prototype.InterpolantFactoryMethodSmooth=void 0;class a8 extends i7{}a8.prototype.ValueTypeName="color";class N9 extends i7{}N9.prototype.ValueTypeName="number";class L5 extends x9{constructor(J,$,Z,Q){super(J,$,Z,Q)}interpolate_(J,$,Z,Q){let W=this.resultBuffer,X=this.sampleValues,H=this.valueSize,Y=(Z-$)/(Q-$),q=J*H;for(let U=q+H;q!==U;q+=4)A7.slerpFlat(W,0,X,q-H,X,q,Y);return W}}class q9 extends i7{InterpolantFactoryMethodLinear(J){return new L5(this.times,this.values,this.getValueSize(),J)}}q9.prototype.ValueTypeName="quaternion";q9.prototype.DefaultInterpolation=2301;q9.prototype.InterpolantFactoryMethodSmooth=void 0;class h9 extends i7{}h9.prototype.ValueTypeName="string";h9.prototype.ValueBufferType=Array;h9.prototype.DefaultInterpolation=2300;h9.prototype.InterpolantFactoryMethodLinear=void 0;h9.prototype.InterpolantFactoryMethodSmooth=void 0;class z9 extends i7{}z9.prototype.ValueTypeName="vector";class S${constructor(J,$=-1,Z,Q=2500){if(this.name=J,this.tracks=Z,this.duration=$,this.blendMode=Q,this.uuid=n7(),this.duration<0)this.resetDuration()}static parse(J){let $=[],Z=J.tracks,Q=1/(J.fps||1);for(let X=0,H=Z.length;X!==H;++X)$.push(sH(Z[X]).scale(Q));let W=new this(J.name,J.duration,$,J.blendMode);return W.uuid=J.uuid,W}static toJSON(J){let $=[],Z=J.tracks,Q={name:J.name,duration:J.duration,tracks:$,uuid:J.uuid,blendMode:J.blendMode};for(let W=0,X=Z.length;W!==X;++W)$.push(i7.toJSON(Z[W]));return Q}static CreateFromMorphTargetSequence(J,$,Z,Q){let W=$.length,X=[];for(let H=0;H<W;H++){let Y=[],q=[];Y.push((H+W-1)%W,H,(H+1)%W),q.push(0,1,0);let U=cH(Y);if(Y=xZ(Y,1,U),q=xZ(q,1,U),!Q&&Y[0]===0)Y.push(W),q.push(q[0]);X.push(new N9(".morphTargetInfluences["+$[H].name+"]",Y,q).scale(1/Z))}return new this(J,-1,X)}static findByName(J,$){let Z=J;if(!Array.isArray(J)){let Q=J;Z=Q.geometry&&Q.geometry.animations||Q.animations}for(let Q=0;Q<Z.length;Q++)if(Z[Q].name===$)return Z[Q];return null}static CreateClipsFromMorphTargetSequences(J,$,Z){let Q={},W=/^([\w-]*?)([\d]+)$/;for(let H=0,Y=J.length;H<Y;H++){let q=J[H],U=q.name.match(W);if(U&&U.length>1){let K=U[1],E=Q[K];if(!E)Q[K]=E=[];E.push(q)}}let X=[];for(let H in Q)X.push(this.CreateFromMorphTargetSequence(H,Q[H],$,Z));return X}static parseAnimation(J,$){if(!J)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let Z=function(K,E,V,O,_){if(V.length!==0){let R=[],F=[];if(M5(V,R,F,O),R.length!==0)_.push(new K(E,R,F))}},Q=[],W=J.name||"default",X=J.fps||30,H=J.blendMode,Y=J.length||-1,q=J.hierarchy||[];for(let K=0;K<q.length;K++){let E=q[K].keys;if(!E||E.length===0)continue;if(E[0].morphTargets){let V={},O;for(O=0;O<E.length;O++)if(E[O].morphTargets)for(let _=0;_<E[O].morphTargets.length;_++)V[E[O].morphTargets[_]]=-1;for(let _ in V){let R=[],F=[];for(let G=0;G!==E[O].morphTargets.length;++G){let N=E[O];R.push(N.time),F.push(N.morphTarget===_?1:0)}Q.push(new N9(".morphTargetInfluence["+_+"]",R,F))}Y=V.length*X}else{let V=".bones["+$[K].name+"]";Z(z9,V+".position",E,"pos",Q),Z(q9,V+".quaternion",E,"rot",Q),Z(z9,V+".scale",E,"scl",Q)}}if(Q.length===0)return null;return new this(W,Y,Q,H)}resetDuration(){let J=this.tracks,$=0;for(let Z=0,Q=J.length;Z!==Q;++Z){let W=this.tracks[Z];$=Math.max($,W.times[W.times.length-1])}return this.duration=$,this}trim(){for(let J=0;J<this.tracks.length;J++)this.tracks[J].trim(0,this.duration);return this}validate(){let J=!0;for(let $=0;$<this.tracks.length;$++)J=J&&this.tracks[$].validate();return J}optimize(){for(let J=0;J<this.tracks.length;J++)this.tracks[J].optimize();return this}clone(){let J=[];for(let $=0;$<this.tracks.length;$++)J.push(this.tracks[$].clone());return new this.constructor(this.name,this.duration,J,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function nH(J){switch(J.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return N9;case"vector":case"vector2":case"vector3":case"vector4":return z9;case"color":return a8;case"quaternion":return q9;case"bool":case"boolean":return f9;case"string":return h9}throw Error("THREE.KeyframeTrack: Unsupported typeName: "+J)}function sH(J){if(J.type===void 0)throw Error("THREE.KeyframeTrack: track type undefined, can not parse");let $=nH(J.type);if(J.times===void 0){let Z=[],Q=[];M5(J.keys,Z,Q,"value"),J.times=Z,J.values=Q}if($.parse!==void 0)return $.parse(J);else return new $(J.name,J.times,J.values,J.interpolation)}var O9={enabled:!1,files:{},add:function(J,$){if(this.enabled===!1)return;this.files[J]=$},get:function(J){if(this.enabled===!1)return;return this.files[J]},remove:function(J){delete this.files[J]},clear:function(){this.files={}}};class C5{constructor(J,$,Z){let Q=this,W=!1,X=0,H=0,Y=void 0,q=[];this.onStart=void 0,this.onLoad=J,this.onProgress=$,this.onError=Z,this.itemStart=function(U){if(H++,W===!1){if(Q.onStart!==void 0)Q.onStart(U,X,H)}W=!0},this.itemEnd=function(U){if(X++,Q.onProgress!==void 0)Q.onProgress(U,X,H);if(X===H){if(W=!1,Q.onLoad!==void 0)Q.onLoad()}},this.itemError=function(U){if(Q.onError!==void 0)Q.onError(U)},this.resolveURL=function(U){if(Y)return Y(U);return U},this.setURLModifier=function(U){return Y=U,this},this.addHandler=function(U,K){return q.push(U,K),this},this.removeHandler=function(U){let K=q.indexOf(U);if(K!==-1)q.splice(K,2);return this},this.getHandler=function(U){for(let K=0,E=q.length;K<E;K+=2){let V=q[K],O=q[K+1];if(V.global)V.lastIndex=0;if(V.test(U))return O}return null}}}var iH=new C5;class B9{constructor(J){this.manager=J!==void 0?J:iH,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(J,$){let Z=this;return new Promise(function(Q,W){Z.load(J,Q,$,W)})}parse(){}setCrossOrigin(J){return this.crossOrigin=J,this}setWithCredentials(J){return this.withCredentials=J,this}setPath(J){return this.path=J,this}setResourcePath(J){return this.resourcePath=J,this}setRequestHeader(J){return this.requestHeader=J,this}}B9.DEFAULT_MATERIAL_NAME="__DEFAULT";var H9={};class w5 extends Error{constructor(J,$){super(J);this.response=$}}class u0 extends B9{constructor(J){super(J)}load(J,$,Z,Q){if(J===void 0)J="";if(this.path!==void 0)J=this.path+J;J=this.manager.resolveURL(J);let W=O9.get(J);if(W!==void 0)return this.manager.itemStart(J),setTimeout(()=>{if($)$(W);this.manager.itemEnd(J)},0),W;if(H9[J]!==void 0){H9[J].push({onLoad:$,onProgress:Z,onError:Q});return}H9[J]=[],H9[J].push({onLoad:$,onProgress:Z,onError:Q});let X=new Request(J,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),H=this.mimeType,Y=this.responseType;fetch(X).then((q)=>{if(q.status===200||q.status===0){if(q.status===0)console.warn("THREE.FileLoader: HTTP Status 0 received.");if(typeof ReadableStream>"u"||q.body===void 0||q.body.getReader===void 0)return q;let U=H9[J],K=q.body.getReader(),E=q.headers.get("Content-Length")||q.headers.get("X-File-Size"),V=E?parseInt(E):0,O=V!==0,_=0,R=new ReadableStream({start(F){G();function G(){K.read().then(({done:N,value:z})=>{if(N)F.close();else{_+=z.byteLength;let w=new ProgressEvent("progress",{lengthComputable:O,loaded:_,total:V});for(let k=0,L=U.length;k<L;k++){let S=U[k];if(S.onProgress)S.onProgress(w)}F.enqueue(z),G()}})}}});return new Response(R)}else throw new w5(`fetch for "${q.url}" responded with ${q.status}: ${q.statusText}`,q)}).then((q)=>{switch(Y){case"arraybuffer":return q.arrayBuffer();case"blob":return q.blob();case"document":return q.text().then((U)=>{return new DOMParser().parseFromString(U,H)});case"json":return q.json();default:if(H===void 0)return q.text();else{let K=/charset="?([^;"\s]*)"?/i.exec(H),E=K&&K[1]?K[1].toLowerCase():void 0,V=new TextDecoder(E);return q.arrayBuffer().then((O)=>V.decode(O))}}}).then((q)=>{O9.add(J,q);let U=H9[J];delete H9[J];for(let K=0,E=U.length;K<E;K++){let V=U[K];if(V.onLoad)V.onLoad(q)}}).catch((q)=>{let U=H9[J];if(U===void 0)throw this.manager.itemError(J),q;delete H9[J];for(let K=0,E=U.length;K<E;K++){let V=U[K];if(V.onError)V.onError(q)}this.manager.itemError(J)}).finally(()=>{this.manager.itemEnd(J)}),this.manager.itemStart(J)}setResponseType(J){return this.responseType=J,this}setMimeType(J){return this.mimeType=J,this}}class I5 extends B9{constructor(J){super(J)}load(J,$,Z,Q){if(this.path!==void 0)J=this.path+J;J=this.manager.resolveURL(J);let W=this,X=O9.get(J);if(X!==void 0)return W.manager.itemStart(J),setTimeout(function(){if($)$(X);W.manager.itemEnd(J)},0),X;let H=T$("img");function Y(){if(U(),O9.add(J,this),$)$(this);W.manager.itemEnd(J)}function q(K){if(U(),Q)Q(K);W.manager.itemError(J),W.manager.itemEnd(J)}function U(){H.removeEventListener("load",Y,!1),H.removeEventListener("error",q,!1)}if(H.addEventListener("load",Y,!1),H.addEventListener("error",q,!1),J.slice(0,5)!=="data:"){if(this.crossOrigin!==void 0)H.crossOrigin=this.crossOrigin}return W.manager.itemStart(J),H.src=J,H}}class r8 extends B9{constructor(J){super(J)}load(J,$,Z,Q){let W=new O7,X=new I5(this.manager);return X.setCrossOrigin(this.crossOrigin),X.setPath(this.path),X.load(J,function(H){if(W.image=H,W.needsUpdate=!0,$!==void 0)$(W)},Z,Q),W}}class c$ extends $7{constructor(J,$=1){super();this.isLight=!0,this.type="Light",this.color=new GJ(J),this.intensity=$}dispose(){}copy(J,$){return super.copy(J,$),this.color.copy(J.color),this.intensity=J.intensity,this}toJSON(J){let $=super.toJSON(J);if($.object.color=this.color.getHex(),$.object.intensity=this.intensity,this.groundColor!==void 0)$.object.groundColor=this.groundColor.getHex();if(this.distance!==void 0)$.object.distance=this.distance;if(this.angle!==void 0)$.object.angle=this.angle;if(this.decay!==void 0)$.object.decay=this.decay;if(this.penumbra!==void 0)$.object.penumbra=this.penumbra;if(this.shadow!==void 0)$.object.shadow=this.shadow.toJSON();return $}}class t8 extends c${constructor(J,$,Z){super(J,Z);this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy($7.DEFAULT_UP),this.updateMatrix(),this.groundColor=new GJ($)}copy(J,$){return super.copy(J,$),this.groundColor.copy(J.groundColor),this}}var w8=new AJ,fZ=new T,hZ=new T;class m0{constructor(J){this.camera=J,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new yJ(512,512),this.map=null,this.mapPass=null,this.matrix=new AJ,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new j0,this._frameExtents=new yJ(1,1),this._viewportCount=1,this._viewports=[new J7(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(J){let $=this.camera,Z=this.matrix;fZ.setFromMatrixPosition(J.matrixWorld),$.position.copy(fZ),hZ.setFromMatrixPosition(J.target.matrixWorld),$.lookAt(hZ),$.updateMatrixWorld(),w8.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),this._frustum.setFromProjectionMatrix(w8),Z.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,0.5,0.5,0,0,0,1),Z.multiply(w8)}getViewport(J){return this._viewports[J]}getFrameExtents(){return this._frameExtents}dispose(){if(this.map)this.map.dispose();if(this.mapPass)this.mapPass.dispose()}copy(J){return this.camera=J.camera.clone(),this.bias=J.bias,this.radius=J.radius,this.mapSize.copy(J.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let J={};if(this.bias!==0)J.bias=this.bias;if(this.normalBias!==0)J.normalBias=this.normalBias;if(this.radius!==1)J.radius=this.radius;if(this.mapSize.x!==512||this.mapSize.y!==512)J.mapSize=this.mapSize.toArray();return J.camera=this.camera.toJSON(!1).object,delete J.camera.matrix,J}}class k5 extends m0{constructor(){super(new M7(50,1,0.5,500));this.isSpotLightShadow=!0,this.focus=1}updateMatrices(J){let $=this.camera,Z=X$*2*J.angle*this.focus,Q=this.mapSize.width/this.mapSize.height,W=J.distance||$.far;if(Z!==$.fov||Q!==$.aspect||W!==$.far)$.fov=Z,$.aspect=Q,$.far=W,$.updateProjectionMatrix();super.updateMatrices(J)}copy(J){return super.copy(J),this.focus=J.focus,this}}class e8 extends c${constructor(J,$,Z=0,Q=Math.PI/3,W=0,X=2){super(J,$);this.isSpotLight=!0,this.type="SpotLight",this.position.copy($7.DEFAULT_UP),this.updateMatrix(),this.target=new $7,this.distance=Z,this.angle=Q,this.penumbra=W,this.decay=X,this.map=null,this.shadow=new k5}get power(){return this.intensity*Math.PI}set power(J){this.intensity=J/Math.PI}dispose(){this.shadow.dispose()}copy(J,$){return super.copy(J,$),this.distance=J.distance,this.angle=J.angle,this.penumbra=J.penumbra,this.decay=J.decay,this.target=J.target.clone(),this.shadow=J.shadow.clone(),this}}var bZ=new AJ,w$=new T,I8=new T;class P5 extends m0{constructor(){super(new M7(90,1,0.5,500));this.isPointLightShadow=!0,this._frameExtents=new yJ(4,2),this._viewportCount=6,this._viewports=[new J7(2,1,1,1),new J7(0,1,1,1),new J7(3,1,1,1),new J7(1,1,1,1),new J7(3,0,1,1),new J7(1,0,1,1)],this._cubeDirections=[new T(1,0,0),new T(-1,0,0),new T(0,0,1),new T(0,0,-1),new T(0,1,0),new T(0,-1,0)],this._cubeUps=[new T(0,1,0),new T(0,1,0),new T(0,1,0),new T(0,1,0),new T(0,0,1),new T(0,0,-1)]}updateMatrices(J,$=0){let Z=this.camera,Q=this.matrix,W=J.distance||Z.far;if(W!==Z.far)Z.far=W,Z.updateProjectionMatrix();w$.setFromMatrixPosition(J.matrixWorld),Z.position.copy(w$),I8.copy(Z.position),I8.add(this._cubeDirections[$]),Z.up.copy(this._cubeUps[$]),Z.lookAt(I8),Z.updateMatrixWorld(),Q.makeTranslation(-w$.x,-w$.y,-w$.z),bZ.multiplyMatrices(Z.projectionMatrix,Z.matrixWorldInverse),this._frustum.setFromProjectionMatrix(bZ)}}class n$ extends c${constructor(J,$,Z=0,Q=2){super(J,$);this.isPointLight=!0,this.type="PointLight",this.distance=Z,this.decay=Q,this.shadow=new P5}get power(){return this.intensity*4*Math.PI}set power(J){this.intensity=J/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(J,$){return super.copy(J,$),this.distance=J.distance,this.decay=J.decay,this.shadow=J.shadow.clone(),this}}class A5 extends m0{constructor(){super(new f$(-5,5,5,-5,0.5,500));this.isDirectionalLightShadow=!0}}class V$ extends c${constructor(J,$){super(J,$);this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy($7.DEFAULT_UP),this.updateMatrix(),this.target=new $7,this.shadow=new A5}dispose(){this.shadow.dispose()}copy(J){return super.copy(J),this.target=J.target.clone(),this.shadow=J.shadow.clone(),this}}class b9{static decodeText(J){if(typeof TextDecoder<"u")return new TextDecoder().decode(J);let $="";for(let Z=0,Q=J.length;Z<Q;Z++)$+=String.fromCharCode(J[Z]);try{return decodeURIComponent(escape($))}catch(Z){return $}}static extractUrlBase(J){let $=J.lastIndexOf("/");if($===-1)return"./";return J.slice(0,$+1)}static resolveURL(J,$){if(typeof J!=="string"||J==="")return"";if(/^https?:\/\//i.test($)&&/^\//.test(J))$=$.replace(/(^https?:\/\/[^\/]+).*/i,"$1");if(/^(https?:)?\/\//i.test(J))return J;if(/^data:.*,.*$/i.test(J))return J;if(/^blob:.*$/i.test(J))return J;return $+J}}class J6 extends B9{constructor(J){super(J);if(this.isImageBitmapLoader=!0,typeof createImageBitmap>"u")console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported.");if(typeof fetch>"u")console.warn("THREE.ImageBitmapLoader: fetch() not supported.");this.options={premultiplyAlpha:"none"}}setOptions(J){return this.options=J,this}load(J,$,Z,Q){if(J===void 0)J="";if(this.path!==void 0)J=this.path+J;J=this.manager.resolveURL(J);let W=this,X=O9.get(J);if(X!==void 0){if(W.manager.itemStart(J),X.then){X.then((q)=>{if($)$(q);W.manager.itemEnd(J)}).catch((q)=>{if(Q)Q(q)});return}return setTimeout(function(){if($)$(X);W.manager.itemEnd(J)},0),X}let H={};H.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",H.headers=this.requestHeader;let Y=fetch(J,H).then(function(q){return q.blob()}).then(function(q){return createImageBitmap(q,Object.assign(W.options,{colorSpaceConversion:"none"}))}).then(function(q){if(O9.add(J,q),$)$(q);return W.manager.itemEnd(J),q}).catch(function(q){if(Q)Q(q);O9.remove(J),W.manager.itemError(J),W.manager.itemEnd(J)});O9.add(J,Y),W.manager.itemStart(J)}}class T5{constructor(J,$,Z){this.binding=J,this.valueSize=Z;let Q,W,X;switch($){case"quaternion":Q=this._slerp,W=this._slerpAdditive,X=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(Z*6),this._workIndex=5;break;case"string":case"bool":Q=this._select,W=this._select,X=this._setAdditiveIdentityOther,this.buffer=Array(Z*5);break;default:Q=this._lerp,W=this._lerpAdditive,X=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(Z*5)}this._mixBufferRegion=Q,this._mixBufferRegionAdditive=W,this._setIdentity=X,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(J,$){let Z=this.buffer,Q=this.valueSize,W=J*Q+Q,X=this.cumulativeWeight;if(X===0){for(let H=0;H!==Q;++H)Z[W+H]=Z[H];X=$}else{X+=$;let H=$/X;this._mixBufferRegion(Z,W,0,H,Q)}this.cumulativeWeight=X}accumulateAdditive(J){let $=this.buffer,Z=this.valueSize,Q=Z*this._addIndex;if(this.cumulativeWeightAdditive===0)this._setIdentity();this._mixBufferRegionAdditive($,Q,0,J,Z),this.cumulativeWeightAdditive+=J}apply(J){let $=this.valueSize,Z=this.buffer,Q=J*$+$,W=this.cumulativeWeight,X=this.cumulativeWeightAdditive,H=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,W<1){let Y=$*this._origIndex;this._mixBufferRegion(Z,Q,Y,1-W,$)}if(X>0)this._mixBufferRegionAdditive(Z,Q,this._addIndex*$,1,$);for(let Y=$,q=$+$;Y!==q;++Y)if(Z[Y]!==Z[Y+$]){H.setValue(Z,Q);break}}saveOriginalState(){let J=this.binding,$=this.buffer,Z=this.valueSize,Q=Z*this._origIndex;J.getValue($,Q);for(let W=Z,X=Q;W!==X;++W)$[W]=$[Q+W%Z];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let J=this.valueSize*3;this.binding.setValue(this.buffer,J)}_setAdditiveIdentityNumeric(){let J=this._addIndex*this.valueSize,$=J+this.valueSize;for(let Z=J;Z<$;Z++)this.buffer[Z]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let J=this._origIndex*this.valueSize,$=this._addIndex*this.valueSize;for(let Z=0;Z<this.valueSize;Z++)this.buffer[$+Z]=this.buffer[J+Z]}_select(J,$,Z,Q,W){if(Q>=0.5)for(let X=0;X!==W;++X)J[$+X]=J[Z+X]}_slerp(J,$,Z,Q){A7.slerpFlat(J,$,J,$,J,Z,Q)}_slerpAdditive(J,$,Z,Q,W){let X=this._workIndex*W;A7.multiplyQuaternionsFlat(J,X,J,$,J,Z),A7.slerpFlat(J,$,J,$,J,X,Q)}_lerp(J,$,Z,Q,W){let X=1-Q;for(let H=0;H!==W;++H){let Y=$+H;J[Y]=J[Y]*X+J[Z+H]*Q}}_lerpAdditive(J,$,Z,Q,W){for(let X=0;X!==W;++X){let H=$+X;J[H]=J[H]+J[Z+X]*Q}}}var $6="\\[\\]\\.:\\/",oH=new RegExp("["+$6+"]","g"),Z6="[^"+$6+"]",aH="[^"+$6.replace("\\.","")+"]",rH=/((?:WC+[\/:])*)/.source.replace("WC",Z6),tH=/(WCOD+)?/.source.replace("WCOD",aH),eH=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Z6),Jq=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Z6),$q=new RegExp("^"+rH+tH+eH+Jq+"$"),Zq=["material","materials","bones","map"];class S5{constructor(J,$,Z){let Q=Z||sJ.parseTrackName($);this._targetGroup=J,this._bindings=J.subscribe_($,Q)}getValue(J,$){this.bind();let Z=this._targetGroup.nCachedObjects_,Q=this._bindings[Z];if(Q!==void 0)Q.getValue(J,$)}setValue(J,$){let Z=this._bindings;for(let Q=this._targetGroup.nCachedObjects_,W=Z.length;Q!==W;++Q)Z[Q].setValue(J,$)}bind(){let J=this._bindings;for(let $=this._targetGroup.nCachedObjects_,Z=J.length;$!==Z;++$)J[$].bind()}unbind(){let J=this._bindings;for(let $=this._targetGroup.nCachedObjects_,Z=J.length;$!==Z;++$)J[$].unbind()}}class sJ{constructor(J,$,Z){this.path=$,this.parsedPath=Z||sJ.parseTrackName($),this.node=sJ.findNode(J,this.parsedPath.nodeName),this.rootNode=J,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(J,$,Z){if(!(J&&J.isAnimationObjectGroup))return new sJ(J,$,Z);else return new sJ.Composite(J,$,Z)}static sanitizeNodeName(J){return J.replace(/\s/g,"_").replace(oH,"")}static parseTrackName(J){let $=$q.exec(J);if($===null)throw Error("PropertyBinding: Cannot parse trackName: "+J);let Z={nodeName:$[2],objectName:$[3],objectIndex:$[4],propertyName:$[5],propertyIndex:$[6]},Q=Z.nodeName&&Z.nodeName.lastIndexOf(".");if(Q!==void 0&&Q!==-1){let W=Z.nodeName.substring(Q+1);if(Zq.indexOf(W)!==-1)Z.nodeName=Z.nodeName.substring(0,Q),Z.objectName=W}if(Z.propertyName===null||Z.propertyName.length===0)throw Error("PropertyBinding: can not parse propertyName from trackName: "+J);return Z}static findNode(J,$){if($===void 0||$===""||$==="."||$===-1||$===J.name||$===J.uuid)return J;if(J.skeleton){let Z=J.skeleton.getBoneByName($);if(Z!==void 0)return Z}if(J.children){let Z=function(W){for(let X=0;X<W.length;X++){let H=W[X];if(H.name===$||H.uuid===$)return H;let Y=Z(H.children);if(Y)return Y}return null},Q=Z(J.children);if(Q)return Q}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(J,$){J[$]=this.targetObject[this.propertyName]}_getValue_array(J,$){let Z=this.resolvedProperty;for(let Q=0,W=Z.length;Q!==W;++Q)J[$++]=Z[Q]}_getValue_arrayElement(J,$){J[$]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(J,$){this.resolvedProperty.toArray(J,$)}_setValue_direct(J,$){this.targetObject[this.propertyName]=J[$]}_setValue_direct_setNeedsUpdate(J,$){this.targetObject[this.propertyName]=J[$],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(J,$){this.targetObject[this.propertyName]=J[$],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(J,$){let Z=this.resolvedProperty;for(let Q=0,W=Z.length;Q!==W;++Q)Z[Q]=J[$++]}_setValue_array_setNeedsUpdate(J,$){let Z=this.resolvedProperty;for(let Q=0,W=Z.length;Q!==W;++Q)Z[Q]=J[$++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(J,$){let Z=this.resolvedProperty;for(let Q=0,W=Z.length;Q!==W;++Q)Z[Q]=J[$++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(J,$){this.resolvedProperty[this.propertyIndex]=J[$]}_setValue_arrayElement_setNeedsUpdate(J,$){this.resolvedProperty[this.propertyIndex]=J[$],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(J,$){this.resolvedProperty[this.propertyIndex]=J[$],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(J,$){this.resolvedProperty.fromArray(J,$)}_setValue_fromArray_setNeedsUpdate(J,$){this.resolvedProperty.fromArray(J,$),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(J,$){this.resolvedProperty.fromArray(J,$),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(J,$){this.bind(),this.getValue(J,$)}_setValue_unbound(J,$){this.bind(),this.setValue(J,$)}bind(){let J=this.node,$=this.parsedPath,Z=$.objectName,Q=$.propertyName,W=$.propertyIndex;if(!J)J=sJ.findNode(this.rootNode,$.nodeName),this.node=J;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!J){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(Z){let q=$.objectIndex;switch(Z){case"materials":if(!J.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!J.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}J=J.material.materials;break;case"bones":if(!J.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}J=J.skeleton.bones;for(let U=0;U<J.length;U++)if(J[U].name===q){q=U;break}break;case"map":if("map"in J){J=J.map;break}if(!J.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!J.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}J=J.material.map;break;default:if(J[Z]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}J=J[Z]}if(q!==void 0){if(J[q]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,J);return}J=J[q]}}let X=J[Q];if(X===void 0){let q=$.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+q+"."+Q+" but it wasn't found.",J);return}let H=this.Versioning.None;if(this.targetObject=J,J.needsUpdate!==void 0)H=this.Versioning.NeedsUpdate;else if(J.matrixWorldNeedsUpdate!==void 0)H=this.Versioning.MatrixWorldNeedsUpdate;let Y=this.BindingType.Direct;if(W!==void 0){if(Q==="morphTargetInfluences"){if(!J.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!J.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(J.morphTargetDictionary[W]!==void 0)W=J.morphTargetDictionary[W]}Y=this.BindingType.ArrayElement,this.resolvedProperty=X,this.propertyIndex=W}else if(X.fromArray!==void 0&&X.toArray!==void 0)Y=this.BindingType.HasFromToArray,this.resolvedProperty=X;else if(Array.isArray(X))Y=this.BindingType.EntireArray,this.resolvedProperty=X;else this.propertyName=Q;this.getValue=this.GetterByBindingType[Y],this.setValue=this.SetterByBindingTypeAndVersioning[Y][H]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}sJ.Composite=S5;sJ.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};sJ.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};sJ.prototype.GetterByBindingType=[sJ.prototype._getValue_direct,sJ.prototype._getValue_array,sJ.prototype._getValue_arrayElement,sJ.prototype._getValue_toArray];sJ.prototype.SetterByBindingTypeAndVersioning=[[sJ.prototype._setValue_direct,sJ.prototype._setValue_direct_setNeedsUpdate,sJ.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[sJ.prototype._setValue_array,sJ.prototype._setValue_array_setNeedsUpdate,sJ.prototype._setValue_array_setMatrixWorldNeedsUpdate],[sJ.prototype._setValue_arrayElement,sJ.prototype._setValue_arrayElement_setNeedsUpdate,sJ.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[sJ.prototype._setValue_fromArray,sJ.prototype._setValue_fromArray_setNeedsUpdate,sJ.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class j5{constructor(J,$,Z=null,Q=$.blendMode){this._mixer=J,this._clip=$,this._localRoot=Z,this.blendMode=Q;let W=$.tracks,X=W.length,H=Array(X),Y={endingStart:2400,endingEnd:2400};for(let q=0;q!==X;++q){let U=W[q].createInterpolant(null);H[q]=U,U.settings=Y}this._interpolantSettings=Y,this._interpolants=H,this._propertyBindings=Array(X),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=2201,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(J){return this._startTime=J,this}setLoop(J,$){return this.loop=J,this.repetitions=$,this}setEffectiveWeight(J){return this.weight=J,this._effectiveWeight=this.enabled?J:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(J){return this._scheduleFading(J,0,1)}fadeOut(J){return this._scheduleFading(J,1,0)}crossFadeFrom(J,$,Z){if(J.fadeOut($),this.fadeIn($),Z){let Q=this._clip.duration,W=J._clip.duration,X=W/Q,H=Q/W;J.warp(1,X,$),this.warp(H,1,$)}return this}crossFadeTo(J,$,Z){return J.crossFadeFrom(this,$,Z)}stopFading(){let J=this._weightInterpolant;if(J!==null)this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(J);return this}setEffectiveTimeScale(J){return this.timeScale=J,this._effectiveTimeScale=this.paused?0:J,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(J){return this.timeScale=this._clip.duration/J,this.stopWarping()}syncWith(J){return this.time=J.time,this.timeScale=J.timeScale,this.stopWarping()}halt(J){return this.warp(this._effectiveTimeScale,0,J)}warp(J,$,Z){let Q=this._mixer,W=Q.time,X=this.timeScale,H=this._timeScaleInterpolant;if(H===null)H=Q._lendControlInterpolant(),this._timeScaleInterpolant=H;let{parameterPositions:Y,sampleValues:q}=H;return Y[0]=W,Y[1]=W+Z,q[0]=J/X,q[1]=$/X,this}stopWarping(){let J=this._timeScaleInterpolant;if(J!==null)this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(J);return this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(J,$,Z,Q){if(!this.enabled){this._updateWeight(J);return}let W=this._startTime;if(W!==null){let Y=(J-W)*Z;if(Y<0||Z===0)$=0;else this._startTime=null,$=Z*Y}$*=this._updateTimeScale(J);let X=this._updateTime($),H=this._updateWeight(J);if(H>0){let Y=this._interpolants,q=this._propertyBindings;switch(this.blendMode){case 2501:for(let U=0,K=Y.length;U!==K;++U)Y[U].evaluate(X),q[U].accumulateAdditive(H);break;case 2500:default:for(let U=0,K=Y.length;U!==K;++U)Y[U].evaluate(X),q[U].accumulate(Q,H)}}}_updateWeight(J){let $=0;if(this.enabled){$=this.weight;let Z=this._weightInterpolant;if(Z!==null){let Q=Z.evaluate(J)[0];if($*=Q,J>Z.parameterPositions[1]){if(this.stopFading(),Q===0)this.enabled=!1}}}return this._effectiveWeight=$,$}_updateTimeScale(J){let $=0;if(!this.paused){$=this.timeScale;let Z=this._timeScaleInterpolant;if(Z!==null){let Q=Z.evaluate(J)[0];if($*=Q,J>Z.parameterPositions[1])if(this.stopWarping(),$===0)this.paused=!0;else this.timeScale=$}}return this._effectiveTimeScale=$,$}_updateTime(J){let $=this._clip.duration,Z=this.loop,Q=this.time+J,W=this._loopCount,X=Z===2202;if(J===0){if(W===-1)return Q;return X&&(W&1)===1?$-Q:Q}if(Z===2200){if(W===-1)this._loopCount=0,this._setEndings(!0,!0,!1);J:{if(Q>=$)Q=$;else if(Q<0)Q=0;else{this.time=Q;break J}if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;this.time=Q,this._mixer.dispatchEvent({type:"finished",action:this,direction:J<0?-1:1})}}else{if(W===-1)if(J>=0)W=0,this._setEndings(!0,this.repetitions===0,X);else this._setEndings(this.repetitions===0,!0,X);if(Q>=$||Q<0){let H=Math.floor(Q/$);Q-=$*H,W+=Math.abs(H);let Y=this.repetitions-W;if(Y<=0){if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;Q=J>0?$:0,this.time=Q,this._mixer.dispatchEvent({type:"finished",action:this,direction:J>0?1:-1})}else{if(Y===1){let q=J<0;this._setEndings(q,!q,X)}else this._setEndings(!1,!1,X);this._loopCount=W,this.time=Q,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:H})}}else this.time=Q;if(X&&(W&1)===1)return $-Q}return Q}_setEndings(J,$,Z){let Q=this._interpolantSettings;if(Z)Q.endingStart=2401,Q.endingEnd=2401;else{if(J)Q.endingStart=this.zeroSlopeAtStart?2401:2400;else Q.endingStart=2402;if($)Q.endingEnd=this.zeroSlopeAtEnd?2401:2400;else Q.endingEnd=2402}}_scheduleFading(J,$,Z){let Q=this._mixer,W=Q.time,X=this._weightInterpolant;if(X===null)X=Q._lendControlInterpolant(),this._weightInterpolant=X;let{parameterPositions:H,sampleValues:Y}=X;return H[0]=W,Y[0]=$,H[1]=W+J,Y[1]=Z,this}}var Qq=new Float32Array(1);class Q6 extends M9{constructor(J){super();this._root=J,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(J,$){let Z=J._localRoot||this._root,Q=J._clip.tracks,W=Q.length,X=J._propertyBindings,H=J._interpolants,Y=Z.uuid,q=this._bindingsByRootAndName,U=q[Y];if(U===void 0)U={},q[Y]=U;for(let K=0;K!==W;++K){let E=Q[K],V=E.name,O=U[V];if(O!==void 0)++O.referenceCount,X[K]=O;else{if(O=X[K],O!==void 0){if(O._cacheIndex===null)++O.referenceCount,this._addInactiveBinding(O,Y,V);continue}let _=$&&$._propertyBindings[K].binding.parsedPath;O=new T5(sJ.create(Z,V,_),E.ValueTypeName,E.getValueSize()),++O.referenceCount,this._addInactiveBinding(O,Y,V),X[K]=O}H[K].resultBuffer=O.buffer}}_activateAction(J){if(!this._isActiveAction(J)){if(J._cacheIndex===null){let Z=(J._localRoot||this._root).uuid,Q=J._clip.uuid,W=this._actionsByClip[Q];this._bindAction(J,W&&W.knownActions[0]),this._addInactiveAction(J,Q,Z)}let $=J._propertyBindings;for(let Z=0,Q=$.length;Z!==Q;++Z){let W=$[Z];if(W.useCount++===0)this._lendBinding(W),W.saveOriginalState()}this._lendAction(J)}}_deactivateAction(J){if(this._isActiveAction(J)){let $=J._propertyBindings;for(let Z=0,Q=$.length;Z!==Q;++Z){let W=$[Z];if(--W.useCount===0)W.restoreOriginalState(),this._takeBackBinding(W)}this._takeBackAction(J)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let J=this;this.stats={actions:{get total(){return J._actions.length},get inUse(){return J._nActiveActions}},bindings:{get total(){return J._bindings.length},get inUse(){return J._nActiveBindings}},controlInterpolants:{get total(){return J._controlInterpolants.length},get inUse(){return J._nActiveControlInterpolants}}}}_isActiveAction(J){let $=J._cacheIndex;return $!==null&&$<this._nActiveActions}_addInactiveAction(J,$,Z){let Q=this._actions,W=this._actionsByClip,X=W[$];if(X===void 0)X={knownActions:[J],actionByRoot:{}},J._byClipCacheIndex=0,W[$]=X;else{let H=X.knownActions;J._byClipCacheIndex=H.length,H.push(J)}J._cacheIndex=Q.length,Q.push(J),X.actionByRoot[Z]=J}_removeInactiveAction(J){let $=this._actions,Z=$[$.length-1],Q=J._cacheIndex;Z._cacheIndex=Q,$[Q]=Z,$.pop(),J._cacheIndex=null;let W=J._clip.uuid,X=this._actionsByClip,H=X[W],Y=H.knownActions,q=Y[Y.length-1],U=J._byClipCacheIndex;q._byClipCacheIndex=U,Y[U]=q,Y.pop(),J._byClipCacheIndex=null;let K=H.actionByRoot,E=(J._localRoot||this._root).uuid;if(delete K[E],Y.length===0)delete X[W];this._removeInactiveBindingsForAction(J)}_removeInactiveBindingsForAction(J){let $=J._propertyBindings;for(let Z=0,Q=$.length;Z!==Q;++Z){let W=$[Z];if(--W.referenceCount===0)this._removeInactiveBinding(W)}}_lendAction(J){let $=this._actions,Z=J._cacheIndex,Q=this._nActiveActions++,W=$[Q];J._cacheIndex=Q,$[Q]=J,W._cacheIndex=Z,$[Z]=W}_takeBackAction(J){let $=this._actions,Z=J._cacheIndex,Q=--this._nActiveActions,W=$[Q];J._cacheIndex=Q,$[Q]=J,W._cacheIndex=Z,$[Z]=W}_addInactiveBinding(J,$,Z){let Q=this._bindingsByRootAndName,W=this._bindings,X=Q[$];if(X===void 0)X={},Q[$]=X;X[Z]=J,J._cacheIndex=W.length,W.push(J)}_removeInactiveBinding(J){let $=this._bindings,Z=J.binding,Q=Z.rootNode.uuid,W=Z.path,X=this._bindingsByRootAndName,H=X[Q],Y=$[$.length-1],q=J._cacheIndex;if(Y._cacheIndex=q,$[q]=Y,$.pop(),delete H[W],Object.keys(H).length===0)delete X[Q]}_lendBinding(J){let $=this._bindings,Z=J._cacheIndex,Q=this._nActiveBindings++,W=$[Q];J._cacheIndex=Q,$[Q]=J,W._cacheIndex=Z,$[Z]=W}_takeBackBinding(J){let $=this._bindings,Z=J._cacheIndex,Q=--this._nActiveBindings,W=$[Q];J._cacheIndex=Q,$[Q]=J,W._cacheIndex=Z,$[Z]=W}_lendControlInterpolant(){let J=this._controlInterpolants,$=this._nActiveControlInterpolants++,Z=J[$];if(Z===void 0)Z=new o8(new Float32Array(2),new Float32Array(2),1,Qq),Z.__cacheIndex=$,J[$]=Z;return Z}_takeBackControlInterpolant(J){let $=this._controlInterpolants,Z=J.__cacheIndex,Q=--this._nActiveControlInterpolants,W=$[Q];J.__cacheIndex=Q,$[Q]=J,W.__cacheIndex=Z,$[Z]=W}clipAction(J,$,Z){let Q=$||this._root,W=Q.uuid,X=typeof J==="string"?S$.findByName(Q,J):J,H=X!==null?X.uuid:J,Y=this._actionsByClip[H],q=null;if(Z===void 0)if(X!==null)Z=X.blendMode;else Z=2500;if(Y!==void 0){let K=Y.actionByRoot[W];if(K!==void 0&&K.blendMode===Z)return K;if(q=Y.knownActions[0],X===null)X=q._clip}if(X===null)return null;let U=new j5(this,X,$,Z);return this._bindAction(U,q),this._addInactiveAction(U,H,W),U}existingAction(J,$){let Z=$||this._root,Q=Z.uuid,W=typeof J==="string"?S$.findByName(Z,J):J,X=W?W.uuid:J,H=this._actionsByClip[X];if(H!==void 0)return H.actionByRoot[Q]||null;return null}stopAllAction(){let J=this._actions,$=this._nActiveActions;for(let Z=$-1;Z>=0;--Z)J[Z].stop();return this}update(J){J*=this.timeScale;let $=this._actions,Z=this._nActiveActions,Q=this.time+=J,W=Math.sign(J),X=this._accuIndex^=1;for(let q=0;q!==Z;++q)$[q]._update(Q,J,W,X);let H=this._bindings,Y=this._nActiveBindings;for(let q=0;q!==Y;++q)H[q].apply(X);return this}setTime(J){this.time=0;for(let $=0;$<this._actions.length;$++)this._actions[$].time=0;return this.update(J)}getRoot(){return this._root}uncacheClip(J){let $=this._actions,Z=J.uuid,Q=this._actionsByClip,W=Q[Z];if(W!==void 0){let X=W.knownActions;for(let H=0,Y=X.length;H!==Y;++H){let q=X[H];this._deactivateAction(q);let U=q._cacheIndex,K=$[$.length-1];q._cacheIndex=null,q._byClipCacheIndex=null,K._cacheIndex=U,$[U]=K,$.pop(),this._removeInactiveBindingsForAction(q)}delete Q[Z]}}uncacheRoot(J){let $=J.uuid,Z=this._actionsByClip;for(let X in Z){let H=Z[X].actionByRoot,Y=H[$];if(Y!==void 0)this._deactivateAction(Y),this._removeInactiveAction(Y)}let Q=this._bindingsByRootAndName,W=Q[$];if(W!==void 0)for(let X in W){let H=W[X];H.restoreOriginalState(),this._removeInactiveBinding(H)}}uncacheAction(J,$){let Z=this.existingAction(J,$);if(Z!==null)this._deactivateAction(Z),this._removeInactiveAction(Z)}}if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"160"}}));if(typeof window<"u")if(window.__THREE__)console.warn("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="160";var p7={jab:{id:0,startup:0.1,active:0.06,recovery:0.16,dmg:6,stam:4,reach:1.95,h:1,score:9},cross:{id:1,startup:0.16,active:0.07,recovery:0.28,dmg:12,stam:9,reach:2.05,h:1,score:15},hookL:{id:2,startup:0.21,active:0.07,recovery:0.32,dmg:14,stam:11,reach:1.65,h:1,score:17},hookR:{id:3,startup:0.21,active:0.07,recovery:0.32,dmg:14,stam:11,reach:1.65,h:1,score:17},upper:{id:4,startup:0.25,active:0.08,recovery:0.36,dmg:17,stam:13,reach:1.55,h:1,score:21},body:{id:5,startup:0.18,active:0.07,recovery:0.27,dmg:10,stam:8,reach:1.75,h:0,score:13,stamDmg:9}},d0=["jab","cross","hookL","hookR","upper","body"],DJ={hpMax:100,stMax:100,guardMax:60,stRegenIdle:7.5,stRegenMove:4,stRegenGuard:-6,guardDmgMul:0.22,guardBreakStun:0.8,dodgeDur:0.34,dodgeIframe:0.2,dodgeStam:7,perfectWindow:0.12,counterWin:0.55,counterMul:1.65,momHitClean:6,momCounter:12,momDodgePerf:8,momHitTaken:8,momWhiff:7,momKd:20,momDmgBonus:0.15,roundLen:30,rounds:3,restLen:5,exhaustedAt:14,exhaustedSlow:1.35,exhaustedDmg:0.6,finisherMom:85,finisherHp:30,kdGetupTaps:3};function v5(){let J=2;try{let $=navigator.deviceMemory||4,Z=navigator.hardwareConcurrency||4,Q=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||"");if($>=6&&Z>=8)J=Q?2:3;else if($>=4&&Z>=6)J=2;else if($>=2)J=1;else J=0;if(window.WD60_FX&&window.WD60_FX.state&&window.WD60_FX.state()==="on")J=0;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)J=0}catch($){}return J}var c0=[{name:"LOW",dpr:0.8,shadow:!1,shRes:512,crowd:380,particles:44,aa:!1,flags:0,fog:!0,crowdBob:0.35},{name:"MEDIUM",dpr:1,shadow:!1,shRes:512,crowd:900,particles:80,aa:!1,flags:4,fog:!0,crowdBob:0.7},{name:"HIGH",dpr:1.35,shadow:!0,shRes:1024,crowd:1500,particles:130,aa:!1,flags:8,fog:!0,crowdBob:1},{name:"ULTRA",dpr:2,shadow:!0,shRes:1024,crowd:2200,particles:190,aa:!0,flags:10,fog:!1,crowdBob:1}];class X6{constructor(){this.ok=!1,this.ctx=null,this.intensity=0.3,this.mode="menu",this.timer=0,this.step=0,this._crowdGain=null,this._musicGain=null,this._master=null}init(){if(this.ok)return!0;try{let J=window.AudioContext||window.webkitAudioContext;if(!J)return!1;this.ctx=new J,this._master=this.ctx.createGain(),this._master.gain.value=0.5,this._master.connect(this.ctx.destination);let $=2*this.ctx.sampleRate,Z=this.ctx.createBuffer(1,$,this.ctx.sampleRate),Q=Z.getChannelData(0),W=0;for(let Y=0;Y<$;Y++){let q=Math.random()*2-1;W=(W+0.02*q)/1.02,Q[Y]=W*3.5}let X=this.ctx.createBufferSource();X.buffer=Z,X.loop=!0;let H=this.ctx.createBiquadFilter();H.type="bandpass",H.frequency.value=520,H.Q.value=0.6,this._crowdGain=this.ctx.createGain(),this._crowdGain.gain.value=0,X.connect(H),H.connect(this._crowdGain),this._crowdGain.connect(this._master),X.start(),this._musicGain=this.ctx.createGain(),this._musicGain.gain.value=0,this._musicGain.connect(this._master),this.ok=!0}catch(J){this.ok=!1}return this.ok}resume(){try{if(this.ctx&&this.ctx.state==="suspended")this.ctx.resume()}catch(J){}}suspend(){try{if(this.ctx&&this.ctx.state==="running")this.ctx.suspend()}catch(J){}}setMode(J){this.mode=J}setIntensity(J){this.intensity=Math.max(0,Math.min(1,J))}update(J){if(!this.ok)return;this.timer-=J;let $=this._musicGain.gain,Z=this.mode==="menu"||this.mode==="rest"?0.05:this.mode==="final"?0.16+this.intensity*0.14:0.1+this.intensity*0.12;if($.value+=(Z-$.value)*Math.min(1,J*2),this._crowdGain)this._crowdGain.gain.value+=(0.05+this.intensity*0.3-this._crowdGain.gain.value)*Math.min(1,J*1.5);if(this.timer<=0&&(this.mode==="gameplay"||this.mode==="final")){let Q=92+this.intensity*46;if(this.timer=60/Q/2,this.step++,this.step%2===0)this._thump(0.25+this.intensity*0.3,52);else if(this.intensity>0.45)this._hat(0.05+this.intensity*0.05);if(this.intensity>0.75&&this.step%8===4)this._thump(0.2,38)}}_thump(J,$){try{let Z=this.ctx,Q=Z.currentTime,W=Z.createOscillator(),X=Z.createGain();W.type="sine",W.frequency.setValueAtTime($,Q),W.frequency.exponentialRampToValueAtTime(Math.max(28,$*0.55),Q+0.12),X.gain.setValueAtTime(J,Q),X.gain.exponentialRampToValueAtTime(0.001,Q+0.16),W.connect(X),X.connect(this._musicGain),W.start(Q),W.stop(Q+0.2)}catch(Z){}}_hat(J){try{let $=this.ctx,Z=$.currentTime,Q=Math.floor($.sampleRate*0.04),W=$.createBuffer(1,Q,$.sampleRate),X=W.getChannelData(0);for(let U=0;U<Q;U++)X[U]=(Math.random()*2-1)*(1-U/Q);let H=$.createBufferSource();H.buffer=W;let Y=$.createBiquadFilter();Y.type="highpass",Y.frequency.value=7000;let q=$.createGain();q.gain.value=J,H.connect(Y),Y.connect(q),q.connect(this._musicGain),H.start(Z)}catch($){}}bell(){this._metal(880,0.9),this._metal(1320,0.7)}bellEnd(){this._metal(660,0.9),this._metal(990,0.6)}_metal(J,$){if(!this.ok)return;try{let Z=this.ctx,Q=Z.currentTime,W=Z.createOscillator(),X=Z.createGain(),H=Z.createOscillator();W.type="triangle",W.frequency.value=J,H.type="sine",H.frequency.value=J*2.76,X.gain.setValueAtTime($*0.35,Q),X.gain.exponentialRampToValueAtTime(0.001,Q+1.1),W.connect(X),H.connect(X),X.connect(this._master),W.start(Q),H.start(Q),W.stop(Q+1.2),H.stop(Q+1.2)}catch(Z){}}whoosh(J){if(!this.ok)return;try{let $=this.ctx,Z=$.currentTime,Q=Math.floor($.sampleRate*(J?0.16:0.1)),W=$.createBuffer(1,Q,$.sampleRate),X=W.getChannelData(0);for(let U=0;U<Q;U++)X[U]=(Math.random()*2-1)*Math.pow(1-U/Q,2);let H=$.createBufferSource();H.buffer=W;let Y=$.createBiquadFilter();Y.type="bandpass",Y.Q.value=1.2,Y.frequency.setValueAtTime(400,Z),Y.frequency.exponentialRampToValueAtTime(J?1400:2000,Z+0.09);let q=$.createGain();q.gain.value=J?0.4:0.22,H.connect(Y),Y.connect(q),q.connect(this._master),H.start(Z)}catch($){}}impact(J){if(!this.ok)return;try{let $=this.ctx,Z=$.currentTime,Q=Math.floor($.sampleRate*0.09),W=$.createBuffer(1,Q,$.sampleRate),X=W.getChannelData(0);for(let E=0;E<Q;E++)X[E]=(Math.random()*2-1)*Math.pow(1-E/Q,1.5);let H=$.createBufferSource();H.buffer=W;let Y=$.createBiquadFilter();Y.type="lowpass",Y.frequency.value=J?900:2200;let q=$.createGain();q.gain.value=J?0.85:0.4,H.connect(Y),Y.connect(q),q.connect(this._master),H.start(Z);let U=$.createOscillator(),K=$.createGain();U.type="sine",U.frequency.setValueAtTime(J?95:140,Z),U.frequency.exponentialRampToValueAtTime(40,Z+0.12),K.gain.setValueAtTime(J?0.7:0.3,Z),K.gain.exponentialRampToValueAtTime(0.001,Z+0.15),U.connect(K),K.connect(this._master),U.start(Z),U.stop(Z+0.2)}catch($){}}block(){if(this.impact(!1),this.ok)try{let J=this.ctx,$=J.currentTime,Z=J.createOscillator(),Q=J.createGain();Z.type="square",Z.frequency.value=210,Q.gain.setValueAtTime(0.12,$),Q.gain.exponentialRampToValueAtTime(0.001,$+0.07),Z.connect(Q),Q.connect(this._master),Z.start($),Z.stop($+0.08)}catch(J){}}cheer(J){if(!this.ok)return;try{let $=this._crowdGain.gain,Z=this.ctx.currentTime;$.cancelScheduledValues(Z),$.setValueAtTime(Math.min(1,$.value+(J?0.5:0.28)),Z),$.linearRampToValueAtTime(0.05+this.intensity*0.3,Z+(J?2.2:1.2))}catch($){}}dispose(){try{if(this.ctx)this.ctx.close(),this.ctx=null,this.ok=!1}catch(J){}}}class Y6{constructor(J,$){this.cap=$,this.pos=new Float32Array($*3),this.col=new Float32Array($*3),this.vel=new Float32Array($*3),this.life=new Float32Array($),this.life0=new Float32Array($),this.head=0;let Z=new E7;Z.setAttribute("position",new Z7(this.pos,3).setUsage(y$)),Z.setAttribute("color",new Z7(this.col,3).setUsage(y$)),Z.setDrawRange(0,0);let Q=new E$({size:0.09,vertexColors:!0,transparent:!0,opacity:0.95,depthWrite:!1,blending:pZ});this.points=new l$(Z,Q),this.points.frustumCulled=!1,this.points.renderOrder=5,J.add(this.points),this.geo=Z}burst(J,$,Z,Q,W,X,H){let Y=new GJ(W);for(let q=0;q<Q;q++){let U=this.head;this.head=(this.head+1)%this.cap,this.pos[U*3]=J,this.pos[U*3+1]=$,this.pos[U*3+2]=Z;let K=Math.random()*6.283,E=Math.random();this.vel[U*3]=Math.cos(K)*X*E,this.vel[U*3+1]=H*(0.4+Math.random()*0.8),this.vel[U*3+2]=Math.sin(K)*X*E,this.col[U*3]=Y.r,this.col[U*3+1]=Y.g,this.col[U*3+2]=Y.b,this.life[U]=this.life0[U]=0.35+Math.random()*0.35}}update(J){let $=this.pos,Z=this.vel,Q=!1;for(let W=0;W<this.cap;W++){if(this.life[W]<=0)continue;if(Q=!0,this.life[W]-=J,this.life[W]<=0){$[W*3+1]=-50;continue}if(Z[W*3+1]-=5*J,$[W*3]+=Z[W*3]*J,$[W*3+1]+=Z[W*3+1]*J,$[W*3+2]+=Z[W*3+2]*J,$[W*3+1]<0.02)$[W*3+1]=0.02,Z[W*3+1]*=-0.3,Z[W*3]*=0.7,Z[W*3+2]*=0.7}if(this.points.visible=Q,Q)this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.color.needsUpdate=!0,this.geo.setDrawRange(0,this.cap)}dispose(J){try{J.remove(this.points),this.geo.dispose(),this.points.material.dispose()}catch($){}}}class H6{constructor(J){this.cam=J,this.state="GAMEPLAY",this.until=0,this.t=0,this.shakeAmp=0,this.punchIn=0,this.tmp=new T,this.tmp2=new T,this.look=new T,this.orbitA=0}to(J,$){this.state=J,this.until=this.t+($||0),this.orbitA=Math.random()*6.28}gameplay(){this.to("GAMEPLAY",0)}impact(J){this.shakeAmp=Math.min(0.3,this.shakeAmp+J),this.punchIn=Math.min(1,this.punchIn+J*4)}knockdown(){this.to("KNOCKDOWN",2.6)}update(J,$){if(this.t+=J,this.until>0&&this.t>this.until&&this.state!=="GAMEPLAY")this.state="GAMEPLAY";let Z=this.cam,Q=this.tmp.set(($.player.pos.x+$.ai.pos.x)/2,1.35,($.player.pos.z+$.ai.pos.z)/2),W=Math.abs($.player.pos.z-$.ai.pos.z),X=this.tmp2,H=Q,Y=3.2;switch(this.state){case"INTRO":case"WALKOUT":{let K=this.t*0.25+1.2;X.set(Math.sin(K)*5.5,1.6+Math.sin(this.t*0.4)*0.2,Q.z+Math.cos(K)*5.5),Y=1.6;break}case"ROUND_START":{X.set(Q.x,3.4,Q.z+8.6),Y=2.2;break}case"CORNER":{X.set($.player.pos.x+1.6,1.75,$.player.pos.z-2.8),H=Q.set($.player.pos.x,1.5,$.player.pos.z),Y=2;break}case"KNOCKDOWN":{let K=this.orbitA+this.t*0.22;X.set(Q.x+Math.sin(K)*5.8,1.35,Q.z+Math.cos(K)*5.8),Y=2.4;break}case"VICTORY":case"MEDAL":{let K=this.orbitA+this.t*0.16,E=$.player;X.set(E.pos.x+Math.sin(K)*5.8,2.4+Math.sin(this.t*0.3)*0.3,E.pos.z+Math.cos(K)*5.8),H=Q.set(E.pos.x,1.4,E.pos.z),Y=1.8;break}case"DEFEAT":{X.set($.player.pos.x-2.4,1.2,$.player.pos.z+3.4),H=Q.set($.player.pos.x,0.9,$.player.pos.z),Y=1.6;break}default:{let K=$.player.pos.x,E=$.player.pos.z,O=(this.cam.aspect||1)<1?1.22:1,_=K>0?-1:1;if(X.set(K*0.45+_*(2.3+Math.min(1.1,W*0.22))*O,3.35,Q.z+(7.2+Math.min(2,W*0.5))*O),Y=4.2,$.finalRound)X.y+=0.35,X.x*=0.92}}this.punchIn=Math.max(0,this.punchIn-J*5);let q=this.punchIn*0.45;X.sub(H).multiplyScalar(1-q*0.16).add(H),Z.position.lerp(X,Math.min(1,J*Y)),this.look.lerp(H,Math.min(1,J*Y*1.3)),this.shakeAmp=Math.max(0,this.shakeAmp-J*1.4);let U=this.shakeAmp*0.06;Z.position.x+=(Math.random()-0.5)*U,Z.position.y+=(Math.random()-0.5)*U,Z.lookAt(this.look)}}class q6{constructor(){this.scale=1,this.target=1,this.until=0}slow(J,$){this.scale=J,this.target=J,this.until=$}update(J){if(this.until>0){if(this.until-=J,this.until<=0)this.target=1}return this.scale+=(this.target-this.scale)*Math.min(1,J*8),this.scale}}function U6(J,$){if($===iZ)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),J;if($===v$||$===S0){let Z=J.getIndex();if(Z===null){let H=[],Y=J.getAttribute("position");if(Y!==void 0){for(let q=0;q<Y.count;q++)H.push(q);J.setIndex(H),Z=J.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),J}let Q=Z.count-2,W=[];if($===v$)for(let H=1;H<=Q;H++)W.push(Z.getX(0)),W.push(Z.getX(H)),W.push(Z.getX(H+1));else for(let H=0;H<Q;H++)if(H%2===0)W.push(Z.getX(H)),W.push(Z.getX(H+1)),W.push(Z.getX(H+2));else W.push(Z.getX(H+2)),W.push(Z.getX(H+1)),W.push(Z.getX(H));if(W.length/3!==Q)console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let X=J.clone();return X.setIndex(W),X.clearGroups(),X}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",$),J}class O6 extends B9{constructor(J){super(J);this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function($){return new l5($)}),this.register(function($){return new a5($)}),this.register(function($){return new r5($)}),this.register(function($){return new t5($)}),this.register(function($){return new m5($)}),this.register(function($){return new d5($)}),this.register(function($){return new c5($)}),this.register(function($){return new n5($)}),this.register(function($){return new p5($)}),this.register(function($){return new s5($)}),this.register(function($){return new u5($)}),this.register(function($){return new o5($)}),this.register(function($){return new i5($)}),this.register(function($){return new b5($)}),this.register(function($){return new e5($)}),this.register(function($){return new JQ($)})}load(J,$,Z,Q){let W=this,X;if(this.resourcePath!=="")X=this.resourcePath;else if(this.path!==""){let q=b9.extractUrlBase(J);X=b9.resolveURL(q,this.path)}else X=b9.extractUrlBase(J);this.manager.itemStart(J);let H=function(q){if(Q)Q(q);else console.error(q);W.manager.itemError(J),W.manager.itemEnd(J)},Y=new u0(this.manager);Y.setPath(this.path),Y.setResponseType("arraybuffer"),Y.setRequestHeader(this.requestHeader),Y.setWithCredentials(this.withCredentials),Y.load(J,function(q){try{W.parse(q,X,function(U){$(U),W.manager.itemEnd(J)},H)}catch(U){H(U)}},Z,H)}setDRACOLoader(J){return this.dracoLoader=J,this}setDDSLoader(){throw Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(J){return this.ktx2Loader=J,this}setMeshoptDecoder(J){return this.meshoptDecoder=J,this}register(J){if(this.pluginCallbacks.indexOf(J)===-1)this.pluginCallbacks.push(J);return this}unregister(J){if(this.pluginCallbacks.indexOf(J)!==-1)this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(J),1);return this}parse(J,$,Z,Q){let W,X={},H={},Y=new TextDecoder;if(typeof J==="string")W=JSON.parse(J);else if(J instanceof ArrayBuffer)if(Y.decode(new Uint8Array(J,0,4))===$Q){try{X[mJ.KHR_BINARY_GLTF]=new ZQ(J)}catch(K){if(Q)Q(K);return}W=JSON.parse(X[mJ.KHR_BINARY_GLTF].content)}else W=JSON.parse(Y.decode(J));else W=J;if(W.asset===void 0||W.asset.version[0]<2){if(Q)Q(Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let q=new HQ(W,{path:$||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});q.fileLoader.setRequestHeader(this.requestHeader);for(let U=0;U<this.pluginCallbacks.length;U++){let K=this.pluginCallbacks[U](q);if(!K.name)console.error("THREE.GLTFLoader: Invalid plugin found: missing name");H[K.name]=K,X[K.name]=!0}if(W.extensionsUsed)for(let U=0;U<W.extensionsUsed.length;++U){let K=W.extensionsUsed[U],E=W.extensionsRequired||[];switch(K){case mJ.KHR_MATERIALS_UNLIT:X[K]=new g5;break;case mJ.KHR_DRACO_MESH_COMPRESSION:X[K]=new QQ(W,this.dracoLoader);break;case mJ.KHR_TEXTURE_TRANSFORM:X[K]=new WQ;break;case mJ.KHR_MESH_QUANTIZATION:X[K]=new XQ;break;default:if(E.indexOf(K)>=0&&H[K]===void 0)console.warn('THREE.GLTFLoader: Unknown extension "'+K+'".')}}q.setExtensions(X),q.setPlugins(H),q.parse(Z,Q)}parseAsync(J,$){let Z=this;return new Promise(function(Q,W){Z.parse(J,$,Q,W)})}}function Wq(){let J={};return{get:function($){return J[$]},add:function($,Z){J[$]=Z},remove:function($){delete J[$]},removeAll:function(){J={}}}}var mJ={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class b5{constructor(J){this.parser=J,this.name=mJ.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let J=this.parser,$=this.parser.json.nodes||[];for(let Z=0,Q=$.length;Z<Q;Z++){let W=$[Z];if(W.extensions&&W.extensions[this.name]&&W.extensions[this.name].light!==void 0)J._addNodeRef(this.cache,W.extensions[this.name].light)}}_loadLight(J){let $=this.parser,Z="light:"+J,Q=$.cache.get(Z);if(Q)return Q;let W=$.json,Y=((W.extensions&&W.extensions[this.name]||{}).lights||[])[J],q,U=new GJ(16777215);if(Y.color!==void 0)U.setRGB(Y.color[0],Y.color[1],Y.color[2],J9);let K=Y.range!==void 0?Y.range:0;switch(Y.type){case"directional":q=new V$(U),q.target.position.set(0,0,-1),q.add(q.target);break;case"point":q=new n$(U),q.distance=K;break;case"spot":q=new e8(U),q.distance=K,Y.spot=Y.spot||{},Y.spot.innerConeAngle=Y.spot.innerConeAngle!==void 0?Y.spot.innerConeAngle:0,Y.spot.outerConeAngle=Y.spot.outerConeAngle!==void 0?Y.spot.outerConeAngle:Math.PI/4,q.angle=Y.spot.outerConeAngle,q.penumbra=1-Y.spot.innerConeAngle/Y.spot.outerConeAngle,q.target.position.set(0,0,-1),q.add(q.target);break;default:throw Error("THREE.GLTFLoader: Unexpected light type: "+Y.type)}if(q.position.set(0,0,0),q.decay=2,L9(q,Y),Y.intensity!==void 0)q.intensity=Y.intensity;return q.name=$.createUniqueName(Y.name||"light_"+J),Q=Promise.resolve(q),$.cache.add(Z,Q),Q}getDependency(J,$){if(J!=="light")return;return this._loadLight($)}createNodeAttachment(J){let $=this,Z=this.parser,W=Z.json.nodes[J],H=(W.extensions&&W.extensions[this.name]||{}).light;if(H===void 0)return null;return this._loadLight(H).then(function(Y){return Z._getNodeRef($.cache,H,Y)})}}class g5{constructor(){this.name=mJ.KHR_MATERIALS_UNLIT}getMaterialType(){return f7}extendParams(J,$,Z){let Q=[];J.color=new GJ(1,1,1),J.opacity=1;let W=$.pbrMetallicRoughness;if(W){if(Array.isArray(W.baseColorFactor)){let X=W.baseColorFactor;J.color.setRGB(X[0],X[1],X[2],J9),J.opacity=X[3]}if(W.baseColorTexture!==void 0)Q.push(Z.assignTexture(J,"map",W.baseColorTexture,e7))}return Promise.all(Q)}}class p5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(J,$){let Q=this.parser.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=Q.extensions[this.name].emissiveStrength;if(W!==void 0)$.emissiveIntensity=W;return Promise.resolve()}}class l5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_CLEARCOAT}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if(X.clearcoatFactor!==void 0)$.clearcoat=X.clearcoatFactor;if(X.clearcoatTexture!==void 0)W.push(Z.assignTexture($,"clearcoatMap",X.clearcoatTexture));if(X.clearcoatRoughnessFactor!==void 0)$.clearcoatRoughness=X.clearcoatRoughnessFactor;if(X.clearcoatRoughnessTexture!==void 0)W.push(Z.assignTexture($,"clearcoatRoughnessMap",X.clearcoatRoughnessTexture));if(X.clearcoatNormalTexture!==void 0){if(W.push(Z.assignTexture($,"clearcoatNormalMap",X.clearcoatNormalTexture)),X.clearcoatNormalTexture.scale!==void 0){let H=X.clearcoatNormalTexture.scale;$.clearcoatNormalScale=new yJ(H,H)}}return Promise.all(W)}}class u5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_IRIDESCENCE}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if(X.iridescenceFactor!==void 0)$.iridescence=X.iridescenceFactor;if(X.iridescenceTexture!==void 0)W.push(Z.assignTexture($,"iridescenceMap",X.iridescenceTexture));if(X.iridescenceIor!==void 0)$.iridescenceIOR=X.iridescenceIor;if($.iridescenceThicknessRange===void 0)$.iridescenceThicknessRange=[100,400];if(X.iridescenceThicknessMinimum!==void 0)$.iridescenceThicknessRange[0]=X.iridescenceThicknessMinimum;if(X.iridescenceThicknessMaximum!==void 0)$.iridescenceThicknessRange[1]=X.iridescenceThicknessMaximum;if(X.iridescenceThicknessTexture!==void 0)W.push(Z.assignTexture($,"iridescenceThicknessMap",X.iridescenceThicknessTexture));return Promise.all(W)}}class m5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_SHEEN}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[];$.sheenColor=new GJ(0,0,0),$.sheenRoughness=0,$.sheen=1;let X=Q.extensions[this.name];if(X.sheenColorFactor!==void 0){let H=X.sheenColorFactor;$.sheenColor.setRGB(H[0],H[1],H[2],J9)}if(X.sheenRoughnessFactor!==void 0)$.sheenRoughness=X.sheenRoughnessFactor;if(X.sheenColorTexture!==void 0)W.push(Z.assignTexture($,"sheenColorMap",X.sheenColorTexture,e7));if(X.sheenRoughnessTexture!==void 0)W.push(Z.assignTexture($,"sheenRoughnessMap",X.sheenRoughnessTexture));return Promise.all(W)}}class d5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_TRANSMISSION}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if(X.transmissionFactor!==void 0)$.transmission=X.transmissionFactor;if(X.transmissionTexture!==void 0)W.push(Z.assignTexture($,"transmissionMap",X.transmissionTexture));return Promise.all(W)}}class c5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_VOLUME}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if($.thickness=X.thicknessFactor!==void 0?X.thicknessFactor:0,X.thicknessTexture!==void 0)W.push(Z.assignTexture($,"thicknessMap",X.thicknessTexture));$.attenuationDistance=X.attenuationDistance||1/0;let H=X.attenuationColor||[1,1,1];return $.attenuationColor=new GJ().setRGB(H[0],H[1],H[2],J9),Promise.all(W)}}class n5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_IOR}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Q=this.parser.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=Q.extensions[this.name];return $.ior=W.ior!==void 0?W.ior:1.5,Promise.resolve()}}class s5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_SPECULAR}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if($.specularIntensity=X.specularFactor!==void 0?X.specularFactor:1,X.specularTexture!==void 0)W.push(Z.assignTexture($,"specularIntensityMap",X.specularTexture));let H=X.specularColorFactor||[1,1,1];if($.specularColor=new GJ().setRGB(H[0],H[1],H[2],J9),X.specularColorTexture!==void 0)W.push(Z.assignTexture($,"specularColorMap",X.specularColorTexture,e7));return Promise.all(W)}}class i5{constructor(J){this.parser=J,this.name=mJ.EXT_MATERIALS_BUMP}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if($.bumpScale=X.bumpFactor!==void 0?X.bumpFactor:1,X.bumpTexture!==void 0)W.push(Z.assignTexture($,"bumpMap",X.bumpTexture));return Promise.all(W)}}class o5{constructor(J){this.parser=J,this.name=mJ.KHR_MATERIALS_ANISOTROPY}getMaterialType(J){let Z=this.parser.json.materials[J];if(!Z.extensions||!Z.extensions[this.name])return null;return s7}extendMaterialParams(J,$){let Z=this.parser,Q=Z.json.materials[J];if(!Q.extensions||!Q.extensions[this.name])return Promise.resolve();let W=[],X=Q.extensions[this.name];if(X.anisotropyStrength!==void 0)$.anisotropy=X.anisotropyStrength;if(X.anisotropyRotation!==void 0)$.anisotropyRotation=X.anisotropyRotation;if(X.anisotropyTexture!==void 0)W.push(Z.assignTexture($,"anisotropyMap",X.anisotropyTexture));return Promise.all(W)}}class a5{constructor(J){this.parser=J,this.name=mJ.KHR_TEXTURE_BASISU}loadTexture(J){let $=this.parser,Z=$.json,Q=Z.textures[J];if(!Q.extensions||!Q.extensions[this.name])return null;let W=Q.extensions[this.name],X=$.options.ktx2Loader;if(!X)if(Z.extensionsRequired&&Z.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");else return null;return $.loadTextureImage(J,W.source,X)}}class r5{constructor(J){this.parser=J,this.name=mJ.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(J){let $=this.name,Z=this.parser,Q=Z.json,W=Q.textures[J];if(!W.extensions||!W.extensions[$])return null;let X=W.extensions[$],H=Q.images[X.source],Y=Z.textureLoader;if(H.uri){let q=Z.options.manager.getHandler(H.uri);if(q!==null)Y=q}return this.detectSupport().then(function(q){if(q)return Z.loadTextureImage(J,X.source,Y);if(Q.extensionsRequired&&Q.extensionsRequired.indexOf($)>=0)throw Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return Z.loadTexture(J)})}detectSupport(){if(!this.isSupported)this.isSupported=new Promise(function(J){let $=new Image;$.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",$.onload=$.onerror=function(){J($.height===1)}});return this.isSupported}}class t5{constructor(J){this.parser=J,this.name=mJ.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(J){let $=this.name,Z=this.parser,Q=Z.json,W=Q.textures[J];if(!W.extensions||!W.extensions[$])return null;let X=W.extensions[$],H=Q.images[X.source],Y=Z.textureLoader;if(H.uri){let q=Z.options.manager.getHandler(H.uri);if(q!==null)Y=q}return this.detectSupport().then(function(q){if(q)return Z.loadTextureImage(J,X.source,Y);if(Q.extensionsRequired&&Q.extensionsRequired.indexOf($)>=0)throw Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return Z.loadTexture(J)})}detectSupport(){if(!this.isSupported)this.isSupported=new Promise(function(J){let $=new Image;$.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",$.onload=$.onerror=function(){J($.height===1)}});return this.isSupported}}class e5{constructor(J){this.name=mJ.EXT_MESHOPT_COMPRESSION,this.parser=J}loadBufferView(J){let $=this.parser.json,Z=$.bufferViews[J];if(Z.extensions&&Z.extensions[this.name]){let Q=Z.extensions[this.name],W=this.parser.getDependency("buffer",Q.buffer),X=this.parser.options.meshoptDecoder;if(!X||!X.supported)if($.extensionsRequired&&$.extensionsRequired.indexOf(this.name)>=0)throw Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");else return null;return W.then(function(H){let Y=Q.byteOffset||0,q=Q.byteLength||0,U=Q.count,K=Q.byteStride,E=new Uint8Array(H,Y,q);if(X.decodeGltfBufferAsync)return X.decodeGltfBufferAsync(U,K,E,Q.mode,Q.filter).then(function(V){return V.buffer});else return X.ready.then(function(){let V=new ArrayBuffer(U*K);return X.decodeGltfBuffer(new Uint8Array(V),U,K,E,Q.mode,Q.filter),V})})}else return null}}class JQ{constructor(J){this.name=mJ.EXT_MESH_GPU_INSTANCING,this.parser=J}createNodeMesh(J){let $=this.parser.json,Z=$.nodes[J];if(!Z.extensions||!Z.extensions[this.name]||Z.mesh===void 0)return null;let Q=$.meshes[Z.mesh];for(let q of Q.primitives)if(q.mode!==l7.TRIANGLES&&q.mode!==l7.TRIANGLE_STRIP&&q.mode!==l7.TRIANGLE_FAN&&q.mode!==void 0)return null;let X=Z.extensions[this.name].attributes,H=[],Y={};for(let q in X)H.push(this.parser.getDependency("accessor",X[q]).then((U)=>{return Y[q]=U,Y[q]}));if(H.length<1)return null;return H.push(this.parser.createNodeMesh(J)),Promise.all(H).then((q)=>{let U=q.pop(),K=U.isGroup?U.children:[U],E=q[0].count,V=[];for(let O of K){let _=new AJ,R=new T,F=new A7,G=new T(1,1,1),N=new g$(O.geometry,O.material,E);for(let z=0;z<E;z++){if(Y.TRANSLATION)R.fromBufferAttribute(Y.TRANSLATION,z);if(Y.ROTATION)F.fromBufferAttribute(Y.ROTATION,z);if(Y.SCALE)G.fromBufferAttribute(Y.SCALE,z);N.setMatrixAt(z,_.compose(R,F,G))}for(let z in Y)if(z==="_COLOR_0"){let w=Y[z];N.instanceColor=new H$(w.array,w.itemSize,w.normalized)}else if(z!=="TRANSLATION"&&z!=="ROTATION"&&z!=="SCALE")O.geometry.setAttribute(z,Y[z]);$7.prototype.copy.call(N,O),this.parser.assignFinalMaterial(N),V.push(N)}if(U.isGroup)return U.clear(),U.add(...V),U;return V[0]})}}var $Q="glTF",s$=12,y5={JSON:1313821514,BIN:5130562};class ZQ{constructor(J){this.name=mJ.KHR_BINARY_GLTF,this.content=null,this.body=null;let $=new DataView(J,0,s$),Z=new TextDecoder;if(this.header={magic:Z.decode(new Uint8Array(J.slice(0,4))),version:$.getUint32(4,!0),length:$.getUint32(8,!0)},this.header.magic!==$Q)throw Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");else if(this.header.version<2)throw Error("THREE.GLTFLoader: Legacy binary file detected.");let Q=this.header.length-s$,W=new DataView(J,s$),X=0;while(X<Q){let H=W.getUint32(X,!0);X+=4;let Y=W.getUint32(X,!0);if(X+=4,Y===y5.JSON){let q=new Uint8Array(J,s$+X,H);this.content=Z.decode(q)}else if(Y===y5.BIN){let q=s$+X;this.body=J.slice(q,q+H)}X+=H}if(this.content===null)throw Error("THREE.GLTFLoader: JSON content not found.")}}class QQ{constructor(J,$){if(!$)throw Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=mJ.KHR_DRACO_MESH_COMPRESSION,this.json=J,this.dracoLoader=$,this.dracoLoader.preload()}decodePrimitive(J,$){let Z=this.json,Q=this.dracoLoader,W=J.extensions[this.name].bufferView,X=J.extensions[this.name].attributes,H={},Y={},q={};for(let U in X){let K=G6[U]||U.toLowerCase();H[K]=X[U]}for(let U in J.attributes){let K=G6[U]||U.toLowerCase();if(X[U]!==void 0){let E=Z.accessors[J.attributes[U]],V=G$[E.componentType];q[K]=V.name,Y[K]=E.normalized===!0}}return $.getDependency("bufferView",W).then(function(U){return new Promise(function(K,E){Q.decodeDracoFile(U,function(V){for(let O in V.attributes){let _=V.attributes[O],R=Y[O];if(R!==void 0)_.normalized=R}K(V)},H,q,J9,E)})})}}class WQ{constructor(){this.name=mJ.KHR_TEXTURE_TRANSFORM}extendTexture(J,$){if(($.texCoord===void 0||$.texCoord===J.channel)&&$.offset===void 0&&$.rotation===void 0&&$.scale===void 0)return J;if(J=J.clone(),$.texCoord!==void 0)J.channel=$.texCoord;if($.offset!==void 0)J.offset.fromArray($.offset);if($.rotation!==void 0)J.rotation=$.rotation;if($.scale!==void 0)J.repeat.fromArray($.scale);return J.needsUpdate=!0,J}}class XQ{constructor(){this.name=mJ.KHR_MESH_QUANTIZATION}}class R6 extends x9{constructor(J,$,Z,Q){super(J,$,Z,Q)}copySampleValue_(J){let $=this.resultBuffer,Z=this.sampleValues,Q=this.valueSize,W=J*Q*3+Q;for(let X=0;X!==Q;X++)$[X]=Z[W+X];return $}interpolate_(J,$,Z,Q){let W=this.resultBuffer,X=this.sampleValues,H=this.valueSize,Y=H*2,q=H*3,U=Q-$,K=(Z-$)/U,E=K*K,V=E*K,O=J*q,_=O-q,R=-2*V+3*E,F=V-E,G=1-R,N=F-E+K;for(let z=0;z!==H;z++){let w=X[_+z+H],k=X[_+z+Y]*U,L=X[O+z+H],S=X[O+z]*U;W[z]=G*w+N*k+R*L+F*S}return W}}var Xq=new A7;class YQ extends R6{interpolate_(J,$,Z,Q){let W=super.interpolate_(J,$,Z,Q);return Xq.fromArray(W).normalize().toArray(W),W}}var l7={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},G$={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},x5={9728:mZ,9729:S8,9984:dZ,9985:nZ,9986:cZ,9987:j8},f5={33071:lZ,33648:uZ,10497:T0},K6={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},G6={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},D9={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Yq={CUBICSPLINE:void 0,LINEAR:v8,STEP:sZ},E6={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Hq(J){if(J.DefaultMaterial===void 0)J.DefaultMaterial=new d$({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:gZ});return J.DefaultMaterial}function g9(J,$,Z){for(let Q in Z.extensions)if(J[Q]===void 0)$.userData.gltfExtensions=$.userData.gltfExtensions||{},$.userData.gltfExtensions[Q]=Z.extensions[Q]}function L9(J,$){if($.extras!==void 0)if(typeof $.extras==="object")Object.assign(J.userData,$.extras);else console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+$.extras)}function qq(J,$,Z){let Q=!1,W=!1,X=!1;for(let U=0,K=$.length;U<K;U++){let E=$[U];if(E.POSITION!==void 0)Q=!0;if(E.NORMAL!==void 0)W=!0;if(E.COLOR_0!==void 0)X=!0;if(Q&&W&&X)break}if(!Q&&!W&&!X)return Promise.resolve(J);let H=[],Y=[],q=[];for(let U=0,K=$.length;U<K;U++){let E=$[U];if(Q){let V=E.POSITION!==void 0?Z.getDependency("accessor",E.POSITION):J.attributes.position;H.push(V)}if(W){let V=E.NORMAL!==void 0?Z.getDependency("accessor",E.NORMAL):J.attributes.normal;Y.push(V)}if(X){let V=E.COLOR_0!==void 0?Z.getDependency("accessor",E.COLOR_0):J.attributes.color;q.push(V)}}return Promise.all([Promise.all(H),Promise.all(Y),Promise.all(q)]).then(function(U){let K=U[0],E=U[1],V=U[2];if(Q)J.morphAttributes.position=K;if(W)J.morphAttributes.normal=E;if(X)J.morphAttributes.color=V;return J.morphTargetsRelative=!0,J})}function Uq(J,$){if(J.updateMorphTargets(),$.weights!==void 0)for(let Z=0,Q=$.weights.length;Z<Q;Z++)J.morphTargetInfluences[Z]=$.weights[Z];if($.extras&&Array.isArray($.extras.targetNames)){let Z=$.extras.targetNames;if(J.morphTargetInfluences.length===Z.length){J.morphTargetDictionary={};for(let Q=0,W=Z.length;Q<W;Q++)J.morphTargetDictionary[Z[Q]]=Q}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Kq(J){let $,Z=J.extensions&&J.extensions[mJ.KHR_DRACO_MESH_COMPRESSION];if(Z)$="draco:"+Z.bufferView+":"+Z.indices+":"+V6(Z.attributes);else $=J.indices+":"+V6(J.attributes)+":"+J.mode;if(J.targets!==void 0)for(let Q=0,W=J.targets.length;Q<W;Q++)$+=":"+V6(J.targets[Q]);return $}function V6(J){let $="",Z=Object.keys(J).sort();for(let Q=0,W=Z.length;Q<W;Q++)$+=Z[Q]+":"+J[Z[Q]]+";";return $}function F6(J){switch(J){case Int8Array:return 0.007874015748031496;case Uint8Array:return 0.00392156862745098;case Int16Array:return 0.00003051850947599719;case Uint16Array:return 0.000015259021896696422;default:throw Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Eq(J){if(J.search(/\.jpe?g($|\?)/i)>0||J.search(/^data\:image\/jpeg/)===0)return"image/jpeg";if(J.search(/\.webp($|\?)/i)>0||J.search(/^data\:image\/webp/)===0)return"image/webp";return"image/png"}var Vq=new AJ;class HQ{constructor(J={},$={}){this.json=J,this.extensions={},this.plugins={},this.options=$,this.cache=new Wq,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let Z=!1,Q=!1,W=-1;if(typeof navigator<"u")Z=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,Q=navigator.userAgent.indexOf("Firefox")>-1,W=Q?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1;if(typeof createImageBitmap>"u"||Z||Q&&W<98)this.textureLoader=new r8(this.options.manager);else this.textureLoader=new J6(this.options.manager);if(this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new u0(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials")this.fileLoader.setWithCredentials(!0)}setExtensions(J){this.extensions=J}setPlugins(J){this.plugins=J}parse(J,$){let Z=this,Q=this.json,W=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(X){return X._markDefs&&X._markDefs()}),Promise.all(this._invokeAll(function(X){return X.beforeRoot&&X.beforeRoot()})).then(function(){return Promise.all([Z.getDependencies("scene"),Z.getDependencies("animation"),Z.getDependencies("camera")])}).then(function(X){let H={scene:X[0][Q.scene||0],scenes:X[0],animations:X[1],cameras:X[2],asset:Q.asset,parser:Z,userData:{}};return g9(W,H,Q),L9(H,Q),Promise.all(Z._invokeAll(function(Y){return Y.afterRoot&&Y.afterRoot(H)})).then(function(){J(H)})}).catch($)}_markDefs(){let J=this.json.nodes||[],$=this.json.skins||[],Z=this.json.meshes||[];for(let Q=0,W=$.length;Q<W;Q++){let X=$[Q].joints;for(let H=0,Y=X.length;H<Y;H++)J[X[H]].isBone=!0}for(let Q=0,W=J.length;Q<W;Q++){let X=J[Q];if(X.mesh!==void 0){if(this._addNodeRef(this.meshCache,X.mesh),X.skin!==void 0)Z[X.mesh].isSkinnedMesh=!0}if(X.camera!==void 0)this._addNodeRef(this.cameraCache,X.camera)}}_addNodeRef(J,$){if($===void 0)return;if(J.refs[$]===void 0)J.refs[$]=J.uses[$]=0;J.refs[$]++}_getNodeRef(J,$,Z){if(J.refs[$]<=1)return Z;let Q=Z.clone(),W=(X,H)=>{let Y=this.associations.get(X);if(Y!=null)this.associations.set(H,Y);for(let[q,U]of X.children.entries())W(U,H.children[q])};return W(Z,Q),Q.name+="_instance_"+J.uses[$]++,Q}_invokeOne(J){let $=Object.values(this.plugins);$.push(this);for(let Z=0;Z<$.length;Z++){let Q=J($[Z]);if(Q)return Q}return null}_invokeAll(J){let $=Object.values(this.plugins);$.unshift(this);let Z=[];for(let Q=0;Q<$.length;Q++){let W=J($[Q]);if(W)Z.push(W)}return Z}getDependency(J,$){let Z=J+":"+$,Q=this.cache.get(Z);if(!Q){switch(J){case"scene":Q=this.loadScene($);break;case"node":Q=this._invokeOne(function(W){return W.loadNode&&W.loadNode($)});break;case"mesh":Q=this._invokeOne(function(W){return W.loadMesh&&W.loadMesh($)});break;case"accessor":Q=this.loadAccessor($);break;case"bufferView":Q=this._invokeOne(function(W){return W.loadBufferView&&W.loadBufferView($)});break;case"buffer":Q=this.loadBuffer($);break;case"material":Q=this._invokeOne(function(W){return W.loadMaterial&&W.loadMaterial($)});break;case"texture":Q=this._invokeOne(function(W){return W.loadTexture&&W.loadTexture($)});break;case"skin":Q=this.loadSkin($);break;case"animation":Q=this._invokeOne(function(W){return W.loadAnimation&&W.loadAnimation($)});break;case"camera":Q=this.loadCamera($);break;default:if(Q=this._invokeOne(function(W){return W!=this&&W.getDependency&&W.getDependency(J,$)}),!Q)throw Error("Unknown type: "+J);break}this.cache.add(Z,Q)}return Q}getDependencies(J){let $=this.cache.get(J);if(!$){let Z=this,Q=this.json[J+(J==="mesh"?"es":"s")]||[];$=Promise.all(Q.map(function(W,X){return Z.getDependency(J,X)})),this.cache.add(J,$)}return $}loadBuffer(J){let $=this.json.buffers[J],Z=this.fileLoader;if($.type&&$.type!=="arraybuffer")throw Error("THREE.GLTFLoader: "+$.type+" buffer type is not supported.");if($.uri===void 0&&J===0)return Promise.resolve(this.extensions[mJ.KHR_BINARY_GLTF].body);let Q=this.options;return new Promise(function(W,X){Z.load(b9.resolveURL($.uri,Q.path),W,void 0,function(){X(Error('THREE.GLTFLoader: Failed to load buffer "'+$.uri+'".'))})})}loadBufferView(J){let $=this.json.bufferViews[J];return this.getDependency("buffer",$.buffer).then(function(Z){let Q=$.byteLength||0,W=$.byteOffset||0;return Z.slice(W,W+Q)})}loadAccessor(J){let $=this,Z=this.json,Q=this.json.accessors[J];if(Q.bufferView===void 0&&Q.sparse===void 0){let X=K6[Q.type],H=G$[Q.componentType],Y=Q.normalized===!0,q=new H(Q.count*X);return Promise.resolve(new Z7(q,X,Y))}let W=[];if(Q.bufferView!==void 0)W.push(this.getDependency("bufferView",Q.bufferView));else W.push(null);if(Q.sparse!==void 0)W.push(this.getDependency("bufferView",Q.sparse.indices.bufferView)),W.push(this.getDependency("bufferView",Q.sparse.values.bufferView));return Promise.all(W).then(function(X){let H=X[0],Y=K6[Q.type],q=G$[Q.componentType],U=q.BYTES_PER_ELEMENT,K=U*Y,E=Q.byteOffset||0,V=Q.bufferView!==void 0?Z.bufferViews[Q.bufferView].byteStride:void 0,O=Q.normalized===!0,_,R;if(V&&V!==K){let F=Math.floor(E/V),G="InterleavedBuffer:"+Q.bufferView+":"+Q.componentType+":"+F+":"+Q.count,N=$.cache.get(G);if(!N)_=new q(H,F*V,Q.count*V/U),N=new x0(_,V/U),$.cache.add(G,N);R=new b$(N,Y,E%V/U,O)}else{if(H===null)_=new q(Q.count*Y);else _=new q(H,E,Q.count*Y);R=new Z7(_,Y,O)}if(Q.sparse!==void 0){let F=K6.SCALAR,G=G$[Q.sparse.indices.componentType],N=Q.sparse.indices.byteOffset||0,z=Q.sparse.values.byteOffset||0,w=new G(X[1],N,Q.sparse.count*F),k=new q(X[2],z,Q.sparse.count*Y);if(H!==null)R=new Z7(R.array.slice(),R.itemSize,R.normalized);for(let L=0,S=w.length;L<S;L++){let g=w[L];if(R.setX(g,k[L*Y]),Y>=2)R.setY(g,k[L*Y+1]);if(Y>=3)R.setZ(g,k[L*Y+2]);if(Y>=4)R.setW(g,k[L*Y+3]);if(Y>=5)throw Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return R})}loadTexture(J){let $=this.json,Z=this.options,W=$.textures[J].source,X=$.images[W],H=this.textureLoader;if(X.uri){let Y=Z.manager.getHandler(X.uri);if(Y!==null)H=Y}return this.loadTextureImage(J,W,H)}loadTextureImage(J,$,Z){let Q=this,W=this.json,X=W.textures[J],H=W.images[$],Y=(H.uri||H.bufferView)+":"+X.sampler;if(this.textureCache[Y])return this.textureCache[Y];let q=this.loadImageSource($,Z).then(function(U){if(U.flipY=!1,U.name=X.name||H.name||"",U.name===""&&typeof H.uri==="string"&&H.uri.startsWith("data:image/")===!1)U.name=H.uri;let E=(W.samplers||{})[X.sampler]||{};return U.magFilter=x5[E.magFilter]||S8,U.minFilter=x5[E.minFilter]||j8,U.wrapS=f5[E.wrapS]||T0,U.wrapT=f5[E.wrapT]||T0,Q.associations.set(U,{textures:J}),U}).catch(function(){return null});return this.textureCache[Y]=q,q}loadImageSource(J,$){let Z=this,Q=this.json,W=this.options;if(this.sourceCache[J]!==void 0)return this.sourceCache[J].then((K)=>K.clone());let X=Q.images[J],H=self.URL||self.webkitURL,Y=X.uri||"",q=!1;if(X.bufferView!==void 0)Y=Z.getDependency("bufferView",X.bufferView).then(function(K){q=!0;let E=new Blob([K],{type:X.mimeType});return Y=H.createObjectURL(E),Y});else if(X.uri===void 0)throw Error("THREE.GLTFLoader: Image "+J+" is missing URI and bufferView");let U=Promise.resolve(Y).then(function(K){return new Promise(function(E,V){let O=E;if($.isImageBitmapLoader===!0)O=function(_){let R=new O7(_);R.needsUpdate=!0,E(R)};$.load(b9.resolveURL(K,W.path),O,void 0,V)})}).then(function(K){if(q===!0)H.revokeObjectURL(Y);return K.userData.mimeType=X.mimeType||Eq(X.uri),K}).catch(function(K){throw console.error("THREE.GLTFLoader: Couldn't load texture",Y),K});return this.sourceCache[J]=U,U}assignTexture(J,$,Z,Q){let W=this;return this.getDependency("texture",Z.index).then(function(X){if(!X)return null;if(Z.texCoord!==void 0&&Z.texCoord>0)X=X.clone(),X.channel=Z.texCoord;if(W.extensions[mJ.KHR_TEXTURE_TRANSFORM]){let H=Z.extensions!==void 0?Z.extensions[mJ.KHR_TEXTURE_TRANSFORM]:void 0;if(H){let Y=W.associations.get(X);X=W.extensions[mJ.KHR_TEXTURE_TRANSFORM].extendTexture(X,H),W.associations.set(X,Y)}}if(Q!==void 0)X.colorSpace=Q;return J[$]=X,X})}assignFinalMaterial(J){let{geometry:$,material:Z}=J,Q=$.attributes.tangent===void 0,W=$.attributes.color!==void 0,X=$.attributes.normal===void 0;if(J.isPoints){let H="PointsMaterial:"+Z.uuid,Y=this.cache.get(H);if(!Y)Y=new E$,x7.prototype.copy.call(Y,Z),Y.color.copy(Z.color),Y.map=Z.map,Y.sizeAttenuation=!1,this.cache.add(H,Y);Z=Y}else if(J.isLine){let H="LineBasicMaterial:"+Z.uuid,Y=this.cache.get(H);if(!Y)Y=new b0,x7.prototype.copy.call(Y,Z),Y.color.copy(Z.color),Y.map=Z.map,this.cache.add(H,Y);Z=Y}if(Q||W||X){let H="ClonedMaterial:"+Z.uuid+":";if(Q)H+="derivative-tangents:";if(W)H+="vertex-colors:";if(X)H+="flat-shading:";let Y=this.cache.get(H);if(!Y){if(Y=Z.clone(),W)Y.vertexColors=!0;if(X)Y.flatShading=!0;if(Q){if(Y.normalScale)Y.normalScale.y*=-1;if(Y.clearcoatNormalScale)Y.clearcoatNormalScale.y*=-1}this.cache.add(H,Y),this.associations.set(Y,this.associations.get(Z))}Z=Y}J.material=Z}getMaterialType(){return d$}loadMaterial(J){let $=this,Z=this.json,Q=this.extensions,W=Z.materials[J],X,H={},Y=W.extensions||{},q=[];if(Y[mJ.KHR_MATERIALS_UNLIT]){let K=Q[mJ.KHR_MATERIALS_UNLIT];X=K.getMaterialType(),q.push(K.extendParams(H,W,$))}else{let K=W.pbrMetallicRoughness||{};if(H.color=new GJ(1,1,1),H.opacity=1,Array.isArray(K.baseColorFactor)){let E=K.baseColorFactor;H.color.setRGB(E[0],E[1],E[2],J9),H.opacity=E[3]}if(K.baseColorTexture!==void 0)q.push($.assignTexture(H,"map",K.baseColorTexture,e7));if(H.metalness=K.metallicFactor!==void 0?K.metallicFactor:1,H.roughness=K.roughnessFactor!==void 0?K.roughnessFactor:1,K.metallicRoughnessTexture!==void 0)q.push($.assignTexture(H,"metalnessMap",K.metallicRoughnessTexture)),q.push($.assignTexture(H,"roughnessMap",K.metallicRoughnessTexture));X=this._invokeOne(function(E){return E.getMaterialType&&E.getMaterialType(J)}),q.push(Promise.all(this._invokeAll(function(E){return E.extendMaterialParams&&E.extendMaterialParams(J,H)})))}if(W.doubleSided===!0)H.side=j$;let U=W.alphaMode||E6.OPAQUE;if(U===E6.BLEND)H.transparent=!0,H.depthWrite=!1;else if(H.transparent=!1,U===E6.MASK)H.alphaTest=W.alphaCutoff!==void 0?W.alphaCutoff:0.5;if(W.normalTexture!==void 0&&X!==f7){if(q.push($.assignTexture(H,"normalMap",W.normalTexture)),H.normalScale=new yJ(1,1),W.normalTexture.scale!==void 0){let K=W.normalTexture.scale;H.normalScale.set(K,K)}}if(W.occlusionTexture!==void 0&&X!==f7){if(q.push($.assignTexture(H,"aoMap",W.occlusionTexture)),W.occlusionTexture.strength!==void 0)H.aoMapIntensity=W.occlusionTexture.strength}if(W.emissiveFactor!==void 0&&X!==f7){let K=W.emissiveFactor;H.emissive=new GJ().setRGB(K[0],K[1],K[2],J9)}if(W.emissiveTexture!==void 0&&X!==f7)q.push($.assignTexture(H,"emissiveMap",W.emissiveTexture,e7));return Promise.all(q).then(function(){let K=new X(H);if(W.name)K.name=W.name;if(L9(K,W),$.associations.set(K,{materials:J}),W.extensions)g9(Q,K,W);return K})}createUniqueName(J){let $=sJ.sanitizeNodeName(J||"");if($ in this.nodeNamesUsed)return $+"_"+ ++this.nodeNamesUsed[$];else return this.nodeNamesUsed[$]=0,$}loadGeometries(J){let $=this,Z=this.extensions,Q=this.primitiveCache;function W(H){return Z[mJ.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(H,$).then(function(Y){return h5(Y,H,$)})}let X=[];for(let H=0,Y=J.length;H<Y;H++){let q=J[H],U=Kq(q),K=Q[U];if(K)X.push(K.promise);else{let E;if(q.extensions&&q.extensions[mJ.KHR_DRACO_MESH_COMPRESSION])E=W(q);else E=h5(new E7,q,$);Q[U]={primitive:q,promise:E},X.push(E)}}return Promise.all(X)}loadMesh(J){let $=this,Z=this.json,Q=this.extensions,W=Z.meshes[J],X=W.primitives,H=[];for(let Y=0,q=X.length;Y<q;Y++){let U=X[Y].material===void 0?Hq(this.cache):this.getDependency("material",X[Y].material);H.push(U)}return H.push($.loadGeometries(X)),Promise.all(H).then(function(Y){let q=Y.slice(0,Y.length-1),U=Y[Y.length-1],K=[];for(let V=0,O=U.length;V<O;V++){let _=U[V],R=X[V],F,G=q[V];if(R.mode===l7.TRIANGLES||R.mode===l7.TRIANGLE_STRIP||R.mode===l7.TRIANGLE_FAN||R.mode===void 0){if(F=W.isSkinnedMesh===!0?new n8(_,G):new H7(_,G),F.isSkinnedMesh===!0)F.normalizeSkinWeights();if(R.mode===l7.TRIANGLE_STRIP)F.geometry=U6(F.geometry,S0);else if(R.mode===l7.TRIANGLE_FAN)F.geometry=U6(F.geometry,v$)}else if(R.mode===l7.LINES)F=new s8(_,G);else if(R.mode===l7.LINE_STRIP)F=new p$(_,G);else if(R.mode===l7.LINE_LOOP)F=new i8(_,G);else if(R.mode===l7.POINTS)F=new l$(_,G);else throw Error("THREE.GLTFLoader: Primitive mode unsupported: "+R.mode);if(Object.keys(F.geometry.morphAttributes).length>0)Uq(F,W);if(F.name=$.createUniqueName(W.name||"mesh_"+J),L9(F,W),R.extensions)g9(Q,F,R);$.assignFinalMaterial(F),K.push(F)}for(let V=0,O=K.length;V<O;V++)$.associations.set(K[V],{meshes:J,primitives:V});if(K.length===1){if(W.extensions)g9(Q,K[0],W);return K[0]}let E=new T7;if(W.extensions)g9(Q,E,W);$.associations.set(E,{meshes:J});for(let V=0,O=K.length;V<O;V++)E.add(K[V]);return E})}loadCamera(J){let $,Z=this.json.cameras[J],Q=Z[Z.type];if(!Q){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}if(Z.type==="perspective")$=new M7(oZ.radToDeg(Q.yfov),Q.aspectRatio||1,Q.znear||1,Q.zfar||2000000);else if(Z.type==="orthographic")$=new f$(-Q.xmag,Q.xmag,Q.ymag,-Q.ymag,Q.znear,Q.zfar);if(Z.name)$.name=this.createUniqueName(Z.name);return L9($,Z),Promise.resolve($)}loadSkin(J){let $=this.json.skins[J],Z=[];for(let Q=0,W=$.joints.length;Q<W;Q++)Z.push(this._loadNodeShallow($.joints[Q]));if($.inverseBindMatrices!==void 0)Z.push(this.getDependency("accessor",$.inverseBindMatrices));else Z.push(null);return Promise.all(Z).then(function(Q){let W=Q.pop(),X=Q,H=[],Y=[];for(let q=0,U=X.length;q<U;q++){let K=X[q];if(K){H.push(K);let E=new AJ;if(W!==null)E.fromArray(W.array,q*16);Y.push(E)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',$.joints[q])}return new h0(H,Y)})}loadAnimation(J){let $=this.json,Z=this,Q=$.animations[J],W=Q.name?Q.name:"animation_"+J,X=[],H=[],Y=[],q=[],U=[];for(let K=0,E=Q.channels.length;K<E;K++){let V=Q.channels[K],O=Q.samplers[V.sampler],_=V.target,R=_.node,F=Q.parameters!==void 0?Q.parameters[O.input]:O.input,G=Q.parameters!==void 0?Q.parameters[O.output]:O.output;if(_.node===void 0)continue;X.push(this.getDependency("node",R)),H.push(this.getDependency("accessor",F)),Y.push(this.getDependency("accessor",G)),q.push(O),U.push(_)}return Promise.all([Promise.all(X),Promise.all(H),Promise.all(Y),Promise.all(q),Promise.all(U)]).then(function(K){let E=K[0],V=K[1],O=K[2],_=K[3],R=K[4],F=[];for(let G=0,N=E.length;G<N;G++){let z=E[G],w=V[G],k=O[G],L=_[G],S=R[G];if(z===void 0)continue;if(z.updateMatrix)z.updateMatrix();let g=Z._createAnimationTracks(z,w,k,L,S);if(g)for(let B=0;B<g.length;B++)F.push(g[B])}return new S$(W,void 0,F)})}createNodeMesh(J){let $=this.json,Z=this,Q=$.nodes[J];if(Q.mesh===void 0)return null;return Z.getDependency("mesh",Q.mesh).then(function(W){let X=Z._getNodeRef(Z.meshCache,Q.mesh,W);if(Q.weights!==void 0)X.traverse(function(H){if(!H.isMesh)return;for(let Y=0,q=Q.weights.length;Y<q;Y++)H.morphTargetInfluences[Y]=Q.weights[Y]});return X})}loadNode(J){let $=this.json,Z=this,Q=$.nodes[J],W=Z._loadNodeShallow(J),X=[],H=Q.children||[];for(let q=0,U=H.length;q<U;q++)X.push(Z.getDependency("node",H[q]));let Y=Q.skin===void 0?Promise.resolve(null):Z.getDependency("skin",Q.skin);return Promise.all([W,Promise.all(X),Y]).then(function(q){let U=q[0],K=q[1],E=q[2];if(E!==null)U.traverse(function(V){if(!V.isSkinnedMesh)return;V.bind(E,Vq)});for(let V=0,O=K.length;V<O;V++)U.add(K[V]);return U})}_loadNodeShallow(J){let $=this.json,Z=this.extensions,Q=this;if(this.nodeCache[J]!==void 0)return this.nodeCache[J];let W=$.nodes[J],X=W.name?Q.createUniqueName(W.name):"",H=[],Y=Q._invokeOne(function(q){return q.createNodeMesh&&q.createNodeMesh(J)});if(Y)H.push(Y);if(W.camera!==void 0)H.push(Q.getDependency("camera",W.camera).then(function(q){return Q._getNodeRef(Q.cameraCache,W.camera,q)}));return Q._invokeAll(function(q){return q.createNodeAttachment&&q.createNodeAttachment(J)}).forEach(function(q){H.push(q)}),this.nodeCache[J]=Promise.all(H).then(function(q){let U;if(W.isBone===!0)U=new f0;else if(q.length>1)U=new T7;else if(q.length===1)U=q[0];else U=new $7;if(U!==q[0])for(let K=0,E=q.length;K<E;K++)U.add(q[K]);if(W.name)U.userData.name=W.name,U.name=X;if(L9(U,W),W.extensions)g9(Z,U,W);if(W.matrix!==void 0){let K=new AJ;K.fromArray(W.matrix),U.applyMatrix4(K)}else{if(W.translation!==void 0)U.position.fromArray(W.translation);if(W.rotation!==void 0)U.quaternion.fromArray(W.rotation);if(W.scale!==void 0)U.scale.fromArray(W.scale)}if(!Q.associations.has(U))Q.associations.set(U,{});return Q.associations.get(U).nodes=J,U}),this.nodeCache[J]}loadScene(J){let $=this.extensions,Z=this.json.scenes[J],Q=this,W=new T7;if(Z.name)W.name=Q.createUniqueName(Z.name);if(L9(W,Z),Z.extensions)g9($,W,Z);let X=Z.nodes||[],H=[];for(let Y=0,q=X.length;Y<q;Y++)H.push(Q.getDependency("node",X[Y]));return Promise.all(H).then(function(Y){for(let U=0,K=Y.length;U<K;U++)W.add(Y[U]);let q=(U)=>{let K=new Map;for(let[E,V]of Q.associations)if(E instanceof x7||E instanceof O7)K.set(E,V);return U.traverse((E)=>{let V=Q.associations.get(E);if(V!=null)K.set(E,V)}),K};return Q.associations=q(W),W})}_createAnimationTracks(J,$,Z,Q,W){let X=[],H=J.name?J.name:J.uuid,Y=[];if(D9[W.path]===D9.weights)J.traverse(function(E){if(E.morphTargetInfluences)Y.push(E.name?E.name:E.uuid)});else Y.push(H);let q;switch(D9[W.path]){case D9.weights:q=N9;break;case D9.rotation:q=q9;break;case D9.position:case D9.scale:q=z9;break;default:switch(Z.itemSize){case 1:q=N9;break;case 2:case 3:default:q=z9;break}break}let U=Q.interpolation!==void 0?Yq[Q.interpolation]:v8,K=this._getArrayFromAccessor(Z);for(let E=0,V=Y.length;E<V;E++){let O=new q(Y[E]+"."+D9[W.path],$.array,K,U);if(Q.interpolation==="CUBICSPLINE")this._createCubicSplineTrackInterpolant(O);X.push(O)}return X}_getArrayFromAccessor(J){let $=J.array;if(J.normalized){let Z=F6($.constructor),Q=new Float32Array($.length);for(let W=0,X=$.length;W<X;W++)Q[W]=$[W]*Z;$=Q}return $}_createCubicSplineTrackInterpolant(J){J.createInterpolant=function(Z){return new(this instanceof q9?YQ:R6)(this.times,this.values,this.getValueSize()/3,Z)},J.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Gq(J,$,Z){let Q=$.attributes,W=new y7;if(Q.POSITION!==void 0){let Y=Z.json.accessors[Q.POSITION],q=Y.min,U=Y.max;if(q!==void 0&&U!==void 0){if(W.set(new T(q[0],q[1],q[2]),new T(U[0],U[1],U[2])),Y.normalized){let K=F6(G$[Y.componentType]);W.min.multiplyScalar(K),W.max.multiplyScalar(K)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let X=$.targets;if(X!==void 0){let Y=new T,q=new T;for(let U=0,K=X.length;U<K;U++){let E=X[U];if(E.POSITION!==void 0){let V=Z.json.accessors[E.POSITION],O=V.min,_=V.max;if(O!==void 0&&_!==void 0){if(q.setX(Math.max(Math.abs(O[0]),Math.abs(_[0]))),q.setY(Math.max(Math.abs(O[1]),Math.abs(_[1]))),q.setZ(Math.max(Math.abs(O[2]),Math.abs(_[2]))),V.normalized){let R=F6(G$[V.componentType]);q.multiplyScalar(R)}Y.max(q)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}W.expandByVector(Y)}J.boundingBox=W;let H=new g7;W.getCenter(H.center),H.radius=W.min.distanceTo(W.max)/2,J.boundingSphere=H}function h5(J,$,Z){let Q=$.attributes,W=[];function X(H,Y){return Z.getDependency("accessor",H).then(function(q){J.setAttribute(Y,q)})}for(let H in Q){let Y=G6[H]||H.toLowerCase();if(Y in J.attributes)continue;W.push(X(Q[H],Y))}if($.indices!==void 0&&!J.index){let H=Z.getDependency("accessor",$.indices).then(function(Y){J.setIndex(Y)});W.push(H)}if(iJ.workingColorSpace!==J9&&"COLOR_0"in Q)console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${iJ.workingColorSpace}" not supported.`);return L9(J,$),Gq(J,$,Z),Promise.all(W).then(function(){return $.targets!==void 0?qq(J,$.targets,Z):J})}var qQ=function(){var J="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:q;iekr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:P8Yqdbk;3sezu8Jjjjjbcj;eb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Radz1jjjbhwcj;abad9UhoaicefhldnadTmbaoc;WFbGgocjdaocjd6EhDcbhqinaqae9pmeaDaeaq9RaqaDfae6Egkcsfgocl4cifcd4hxdndndndnaoc9WGgmTmbcbhPcehsawcjdfhzalhHinaraH9Rax6midnaraHaxfgl9RcK6mbczhoinawcj;cbfaogifgoc9WfhOdndndndndnaHaic9WfgAco4fRbbaAci4coG4ciGPlbedibkaO9cb83ibaOcwf9cb83ibxikaOalRblalRbbgAco4gCaCciSgCE86bbaocGfalclfaCfgORbbaAcl4ciGgCaCciSgCE86bbaocVfaOaCfgORbbaAcd4ciGgCaCciSgCE86bbaoc7faOaCfgORbbaAciGgAaAciSgAE86bbaoctfaOaAfgARbbalRbegOco4gCaCciSgCE86bbaoc91faAaCfgARbbaOcl4ciGgCaCciSgCE86bbaoc4faAaCfgARbbaOcd4ciGgCaCciSgCE86bbaoc93faAaCfgARbbaOciGgOaOciSgOE86bbaoc94faAaOfgARbbalRbdgOco4gCaCciSgCE86bbaoc95faAaCfgARbbaOcl4ciGgCaCciSgCE86bbaoc96faAaCfgARbbaOcd4ciGgCaCciSgCE86bbaoc97faAaCfgARbbaOciGgOaOciSgOE86bbaoc98faAaOfgORbbalRbiglco4gAaAciSgAE86bbaoc99faOaAfgORbbalcl4ciGgAaAciSgAE86bbaoc9:faOaAfgORbbalcd4ciGgAaAciSgAE86bbaocufaOaAfgoRbbalciGglalciSglE86bbaoalfhlxdkaOalRbwalRbbgAcl4gCaCcsSgCE86bbaocGfalcwfaCfgORbbaAcsGgAaAcsSgAE86bbaocVfaOaAfgORbbalRbegAcl4gCaCcsSgCE86bbaoc7faOaCfgORbbaAcsGgAaAcsSgAE86bbaoctfaOaAfgORbbalRbdgAcl4gCaCcsSgCE86bbaoc91faOaCfgORbbaAcsGgAaAcsSgAE86bbaoc4faOaAfgORbbalRbigAcl4gCaCcsSgCE86bbaoc93faOaCfgORbbaAcsGgAaAcsSgAE86bbaoc94faOaAfgORbbalRblgAcl4gCaCcsSgCE86bbaoc95faOaCfgORbbaAcsGgAaAcsSgAE86bbaoc96faOaAfgORbbalRbvgAcl4gCaCcsSgCE86bbaoc97faOaCfgORbbaAcsGgAaAcsSgAE86bbaoc98faOaAfgORbbalRbogAcl4gCaCcsSgCE86bbaoc99faOaCfgORbbaAcsGgAaAcsSgAE86bbaoc9:faOaAfgORbbalRbrglcl4gAaAcsSgAE86bbaocufaOaAfgoRbbalcsGglalcsSglE86bbaoalfhlxekaOal8Pbb83bbaOcwfalcwf8Pbb83bbalczfhlkdnaiam9pmbaiczfhoaral9RcL0mekkaiam6mialTmidnakTmbawaPfRbbhOcbhoazhiinaiawcj;cbfaofRbbgAce4cbaAceG9R7aOfgO86bbaiadfhiaocefgoak9hmbkkazcefhzaPcefgPad6hsalhHaPad9hmexvkkcbhlasceGmdxikalaxad2fhCdnakTmbcbhHcehsawcjdfhminaral9Rax6mialTmdalaxfhlawaHfRbbhOcbhoamhiinaiawcj;cbfaofRbbgAce4cbaAceG9R7aOfgO86bbaiadfhiaocefgoak9hmbkamcefhmaHcefgHad6hsaHad9hmbkaChlxikcbhocehsinaral9Rax6mdalTmealaxfhlaocefgoad6hsadao9hmbkaChlxdkcbhlasceGTmekc9:hoxikabaqad2fawcjdfakad2z1jjjb8Aawawcjdfakcufad2fadz1jjjb8Aakaqfhqalmbkc9:hoxekcbc99aral9Radcaadca0ESEhokavcj;ebf8Kjjjjbaok;yzeHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhodnaeTmbcmcsaDceSEhkcbhxcbhmcbhDcbhicbhlindnaoaq9nmbc9:hoxikdndnawRbbgrc;Ve0mbavc;abfalarcl4cu7fcsGcitfgPydlhsaPydbhzdnarcsGgPak9pmbavaiarcu7fcsGcdtfydbaxaPEhraPThPdndnadcd9hmbabaDcetfgHaz87ebaHcdfas87ebaHclfar87ebxekabaDcdtfgHazBdbaHclfasBdbaHcwfarBdbkaxaPfhxavc;abfalcitfgHarBdbaHasBdlavaicdtfarBdbavc;abfalcefcsGglcitfgHazBdbaHarBdlaiaPfhialcefhlxdkdndnaPcsSmbamaPfaPc987fcefhmxekaocefhrao8SbbgPcFeGhHdndnaPcu9mmbarhoxekaocvfhoaHcFbGhHcrhPdninar8SbbgOcFbGaPtaHVhHaOcu9kmearcefhraPcrfgPc8J9hmbxdkkarcefhokaHce4cbaHceG9R7amfhmkdndnadcd9hmbabaDcetfgraz87ebarcdfas87ebarclfam87ebxekabaDcdtfgrazBdbarclfasBdbarcwfamBdbkavc;abfalcitfgramBdbarasBdlavaicdtfamBdbavc;abfalcefcsGglcitfgrazBdbaramBdlaicefhialcefhlxekdnarcpe0mbaxcefgOavaiaqarcsGfRbbgPcl49RcsGcdtfydbaPcz6gHEhravaiaP9RcsGcdtfydbaOaHfgsaPcsGgOEhPaOThOdndnadcd9hmbabaDcetfgzax87ebazcdfar87ebazclfaP87ebxekabaDcdtfgzaxBdbazclfarBdbazcwfaPBdbkavaicdtfaxBdbavc;abfalcitfgzarBdbazaxBdlavaicefgicsGcdtfarBdbavc;abfalcefcsGcitfgzaPBdbazarBdlavaiaHfcsGgicdtfaPBdbavc;abfalcdfcsGglcitfgraxBdbaraPBdlalcefhlaiaOfhiasaOfhxxekaxcbaoRbbgzEgAarc;:eSgrfhsazcsGhCazcl4hXdndnazcs0mbascefhOxekashOavaiaX9RcsGcdtfydbhskdndnaCmbaOcefhxxekaOhxavaiaz9RcsGcdtfydbhOkdndnarTmbaocefhrxekaocdfhrao8SbegHcFeGhPdnaHcu9kmbaocofhAaPcFbGhPcrhodninar8SbbgHcFbGaotaPVhPaHcu9kmearcefhraocrfgoc8J9hmbkaAhrxekarcefhrkaPce4cbaPceG9R7amfgmhAkdndnaXcsSmbarhPxekarcefhPar8SbbgocFeGhHdnaocu9kmbarcvfhsaHcFbGhHcrhodninaP8SbbgrcFbGaotaHVhHarcu9kmeaPcefhPaocrfgoc8J9hmbkashPxekaPcefhPkaHce4cbaHceG9R7amfgmhskdndnaCcsSmbaPhoxekaPcefhoaP8SbbgrcFeGhHdnarcu9kmbaPcvfhOaHcFbGhHcrhrdninao8SbbgPcFbGartaHVhHaPcu9kmeaocefhoarcrfgrc8J9hmbkaOhoxekaocefhokaHce4cbaHceG9R7amfgmhOkdndnadcd9hmbabaDcetfgraA87ebarcdfas87ebarclfaO87ebxekabaDcdtfgraABdbarclfasBdbarcwfaOBdbkavc;abfalcitfgrasBdbaraABdlavaicdtfaABdbavc;abfalcefcsGcitfgraOBdbarasBdlavaicefgicsGcdtfasBdbavc;abfalcdfcsGcitfgraABdbaraOBdlavaiazcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhialcifhlkawcefhwalcsGhlaicsGhiaDcifgDae6mbkkcbc99aoaqSEhokavc;aef8Kjjjjbaok:llevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaicd4cbaice4ceG9R7avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaicd4cbaice4ceG9R7avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;siliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabavcefciGaiVcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:Ohkxekcjjjj94hkkabavcdfciGaiVcetfak87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:Ohqxekcjjjj94hqkabavcufciGaiVcetfaq87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohqxekcjjjj94hqkabavciGaiVcetfaq87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2geTmbinababydbgdcwtcw91:Yadce91cjjj;8ifcjjj98G::NUdbabclfhbaecufgembkkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaiczfhiaeczfheadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkkkebcjwklz9Kbb",$="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q;Aekr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;t9tqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk;h8JlHud97euo978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Rad;8qbbcj;abad9UhoaicefhldnadTmbaoc;WFbGgocjdaocjd6EhwcbhDinaDae9pmeawaeaD9RaDawfae6Egqcsfgoc9WGgkci2hxakcethmaocl4cifcd4hPabaDad2fhscbhzdnincehHalhOcbhAdninaraO9RaP6miavcj;cbfaAak2fhCaOaPfhlcbhidnakc;ab6mbaral9Rc;Gb6mbcbhoinaCaofhidndndndndnaOaoco4fRbbgXciGPlbedibkaipxbbbbbbbbbbbbbbbbpklbxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaialpbbbpklbalczfhlkdndndndndnaXcd4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklzxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaialpbbbpklzalczfhlkdndndndndnaXcl4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklaxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaialpbbbpklaalczfhlkdndndndndnaXco4Plbedibkaipxbbbbbbbbbbbbbbbbpkl8WxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WalclfaYpQbfaXc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WalcwfaYpQbfaXc:q:yjjbfRbbfhlxekaialpbbbpkl8Walczfhlkaoc;abfhiaocjefak0meaihoaral9Rc;Fb0mbkkdndnaiak9pmbaici4hoinaral9RcK6mdaCaifhXdndndndndnaOaico4fRbbaocoG4ciGPlbedibkaXpxbbbbbbbbbbbbbbbbpklbxikaXalpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaXalpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaXalpbbbpklbalczfhlkaocdfhoaiczfgiak6mbkkalTmbaAci6hHalhOaAcefgohAaoclSmdxekkcbhlaHceGmdkdnakTmbavcjdfazfhiavazfpbdbhYcbhXinaiavcj;cbfaXfgopblbgLcep9TaLpxeeeeeeeeeeeeeeeegQp9op9Hp9rgLaoakfpblbg8Acep9Ta8AaQp9op9Hp9rg8ApmbzeHdOiAlCvXoQrLgEaoamfpblbg3cep9Ta3aQp9op9Hp9rg3aoaxfpblbg5cep9Ta5aQp9op9Hp9rg5pmbzeHdOiAlCvXoQrLg8EpmbezHdiOAlvCXorQLgQaQpmbedibedibedibediaYp9UgYp9AdbbaiadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfgoaYaEa8EpmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaoadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfgoaYaLa8ApmwKDYq8AkEx3m5P8Es8FgLa3a5pmwKDYq8AkEx3m5P8Es8Fg8ApmbezHdiOAlvCXorQLgQaQpmbedibedibedibedip9UgYp9AdbbaoadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfgoaYaLa8ApmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaoadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfhiaXczfgXak6mbkkazclfgzad6mbkasavcjdfaqad2;8qbbavavcjdfaqcufad2fad;8qbbaqaDfhDc9:hoalmexikkc9:hoxekcbc99aral9Radcaadca0ESEhokavcj;kbf8Kjjjjbaokwbz:bjjjbk;uzeHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhodnaeTmbcmcsaDceSEhkcbhxcbhmcbhDcbhicbhlindnaoaq9nmbc9:hoxikdndnawRbbgrc;Ve0mbavc;abfalarcl4cu7fcsGcitfgPydlhsaPydbhzdnarcsGgPak9pmbavaiarcu7fcsGcdtfydbaxaPEhraPThPdndnadcd9hmbabaDcetfgHaz87ebaHcdfas87ebaHclfar87ebxekabaDcdtfgHazBdbaHclfasBdbaHcwfarBdbkaxaPfhxavc;abfalcitfgHarBdbaHasBdlavaicdtfarBdbavc;abfalcefcsGglcitfgHazBdbaHarBdlaiaPfhialcefhlxdkdndnaPcsSmbamaPfaPc987fcefhmxekaocefhrao8SbbgPcFeGhHdndnaPcu9mmbarhoxekaocvfhoaHcFbGhHcrhPdninar8SbbgOcFbGaPtaHVhHaOcu9kmearcefhraPcrfgPc8J9hmbxdkkarcefhokaHce4cbaHceG9R7amfhmkdndnadcd9hmbabaDcetfgraz87ebarcdfas87ebarclfam87ebxekabaDcdtfgrazBdbarclfasBdbarcwfamBdbkavc;abfalcitfgramBdbarasBdlavaicdtfamBdbavc;abfalcefcsGglcitfgrazBdbaramBdlaicefhialcefhlxekdnarcpe0mbaxcefgOavaiaqarcsGfRbbgPcl49RcsGcdtfydbaPcz6gHEhravaiaP9RcsGcdtfydbaOaHfgsaPcsGgOEhPaOThOdndnadcd9hmbabaDcetfgzax87ebazcdfar87ebazclfaP87ebxekabaDcdtfgzaxBdbazclfarBdbazcwfaPBdbkavaicdtfaxBdbavc;abfalcitfgzarBdbazaxBdlavaicefgicsGcdtfarBdbavc;abfalcefcsGcitfgzaPBdbazarBdlavaiaHfcsGgicdtfaPBdbavc;abfalcdfcsGglcitfgraxBdbaraPBdlalcefhlaiaOfhiasaOfhxxekaxcbaoRbbgzEgAarc;:eSgrfhsazcsGhCazcl4hXdndnazcs0mbascefhOxekashOavaiaX9RcsGcdtfydbhskdndnaCmbaOcefhxxekaOhxavaiaz9RcsGcdtfydbhOkdndnarTmbaocefhrxekaocdfhrao8SbegHcFeGhPdnaHcu9kmbaocofhAaPcFbGhPcrhodninar8SbbgHcFbGaotaPVhPaHcu9kmearcefhraocrfgoc8J9hmbkaAhrxekarcefhrkaPce4cbaPceG9R7amfgmhAkdndnaXcsSmbarhPxekarcefhPar8SbbgocFeGhHdnaocu9kmbarcvfhsaHcFbGhHcrhodninaP8SbbgrcFbGaotaHVhHarcu9kmeaPcefhPaocrfgoc8J9hmbkashPxekaPcefhPkaHce4cbaHceG9R7amfgmhskdndnaCcsSmbaPhoxekaPcefhoaP8SbbgrcFeGhHdnarcu9kmbaPcvfhOaHcFbGhHcrhrdninao8SbbgPcFbGartaHVhHaPcu9kmeaocefhoarcrfgrc8J9hmbkaOhoxekaocefhokaHce4cbaHceG9R7amfgmhOkdndnadcd9hmbabaDcetfgraA87ebarcdfas87ebarclfaO87ebxekabaDcdtfgraABdbarclfasBdbarcwfaOBdbkavc;abfalcitfgrasBdbaraABdlavaicdtfaABdbavc;abfalcefcsGcitfgraOBdbarasBdlavaicefgicsGcdtfasBdbavc;abfalcdfcsGcitfgraABdbaraOBdlavaiazcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhialcifhlkawcefhwalcsGhlaicsGhiaDcifgDae6mbkkcbc99aoaqSEhokavc;aef8Kjjjjbaok:llevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaicd4cbaice4ceG9R7avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaicd4cbaice4ceG9R7avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:EPliuo97eue978Jjjjjbca9Rhidndnadcl9hmbdnaec98GglTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalae9pmeaiaeciGgvcdtgdVcbczad9R;8kbaiabalcdtfglad;8qbbdnavTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkalaiad;8qbbskdnaec98GgxTmbcbhvabhdinadczfglalpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eaDaopmbediwDqkzHOAKY8AEgoczp:Sep;6egrp;Geaoczp:Reczp:Sep;6egwp;Gep;Kep;Legopxb;:FSb;:FSb;:FSb;:FSawaopxbbbbbbbbbbbbbbbbp:2egqawpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegwawp;Meaoaop;Mearaqaramp9op9rp;Kegoaop;Mep;Kep;Kep;Jep;Negrp;Mepxbbn0bbn0bbn0bbn0gqp;Keczp:Reawarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9op9qgwaoarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogopmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oawaopmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgvax6mbkkaxae9pmbaiaeciGgvcitgdfcbcaad9R;8kbaiabaxcitfglad;8qbbdnavTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eaDaopmbediwDqkzHOAKY8AEgoczp:Sep;6egrp;Geaoczp:Reczp:Sep;6egwp;Gep;Kep;Legopxb;:FSb;:FSb;:FSb;:FSawaopxbbbbbbbbbbbbbbbbp:2egqawpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegwawp;Meaoaop;Mearaqaramp9op9rp;Kegoaop;Mep;Kep;Kep;Jep;Negrp;Mepxbbn0bbn0bbn0bbn0gqp;Keczp:Reawarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9op9qgwaoarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogopmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oawaopmbezHdiOAlvCXorQLp9qpklbkalaiad;8qbbkk;4wllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaqakp;Mearp;Keczp:ReaDakp;Mearp;Keamp9op9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalae9pmbaiaeciGgvcitgofcbcaao9R;8kbaiabalcitfgwao;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaqakp;Mearp;Keczp:ReaDakp;Mearp;Keamp9op9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkawaiao;8qbbkk:Pddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbhdabheinaeaepbbbgocwp:Recwp:Sep;6eaocep:SepxbbjZbbjZbbjZbbjZp:UepxbbjFbbjFbbjFbbjFp9op;Mepkbbaeczfheadclfgdav6mbkkdnaval9pmbaialciGgdcdtgeVcbc;abae9R;8kbaiabavcdtfgvae;8qbbdnadTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjZbbjZbbjZbbjZp:UepxbbjFbbjFbbjFbbjFp9op;Mepklbkavaiae;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz9Tbb",Z=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),Q=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!=="object")return{supported:!1};var W=WebAssembly.validate(Z)?$:J,X,H=WebAssembly.instantiate(Y(W),{}).then(function(G){X=G.instance,X.exports.__wasm_call_ctors()});function Y(G){var N=new Uint8Array(G.length);for(var z=0;z<G.length;++z){var w=G.charCodeAt(z);N[z]=w>96?w-97:w>64?w-39:w+4}var k=0;for(var z=0;z<G.length;++z)N[k++]=N[z]<60?Q[N[z]]:(N[z]-60)*64+N[++z];return N.buffer.slice(0,k)}function q(G,N,z,w,k,L){var S=X.exports.sbrk,g=z+3&-4,B=S(g*w),I=S(k.length),y=new Uint8Array(X.exports.memory.buffer);y.set(k,I);var c=G(B,z,w,I,k.length);if(c==0&&L)L(B,g,w);if(N.set(y.subarray(B,B+z*w)),S(B-S(0)),c!=0)throw Error("Malformed buffer data: "+c)}var U={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},K={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},E=[],V=0;function O(G){var N={object:new Worker(G),pending:0,requests:{}};return N.object.onmessage=function(z){var w=z.data;N.pending-=w.count,N.requests[w.id][w.action](w.value),delete N.requests[w.id]},N}function _(G){var N="var instance; var ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(Y(W))+"]), {}).then(function(result) { instance = result.instance; instance.exports.__wasm_call_ctors(); });self.onmessage = workerProcess;"+q.toString()+F.toString(),z=new Blob([N],{type:"text/javascript"}),w=URL.createObjectURL(z);for(var k=0;k<G;++k)E[k]=O(w);URL.revokeObjectURL(w)}function R(G,N,z,w,k){var L=E[0];for(var S=1;S<E.length;++S)if(E[S].pending<L.pending)L=E[S];return new Promise(function(g,B){var I=new Uint8Array(z),y=V++;L.pending+=G,L.requests[y]={resolve:g,reject:B},L.object.postMessage({id:y,count:G,size:N,source:I,mode:w,filter:k},[I.buffer])})}function F(G){H.then(function(){var N=G.data;try{var z=new Uint8Array(N.count*N.size);q(X.exports[N.mode],z,N.count,N.size,N.source,X.exports[N.filter]),self.postMessage({id:N.id,count:N.count,action:"resolve",value:z},[z.buffer])}catch(w){self.postMessage({id:N.id,count:N.count,action:"reject",value:w})}})}return{ready:H,supported:!0,useWorkers:function(G){_(G)},decodeVertexBuffer:function(G,N,z,w,k){q(X.exports.meshopt_decodeVertexBuffer,G,N,z,w,X.exports[U[k]])},decodeIndexBuffer:function(G,N,z,w){q(X.exports.meshopt_decodeIndexBuffer,G,N,z,w)},decodeIndexSequence:function(G,N,z,w){q(X.exports.meshopt_decodeIndexSequence,G,N,z,w)},decodeGltfBuffer:function(G,N,z,w,k,L){q(X.exports[K[k]],G,N,z,w,X.exports[U[L]])},decodeGltfBufferAsync:function(G,N,z,w,k){if(E.length>0)return R(G,N,z,K[w],U[k]);return H.then(function(){var L=new Uint8Array(G*N);return q(X.exports[K[w]],L,G,N,z,X.exports[U[k]]),L})}}}();function _6(J){let $=new Map,Z=new Map,Q=J.clone();return UQ(J,Q,function(W,X){$.set(X,W),Z.set(W,X)}),Q.traverse(function(W){if(!W.isSkinnedMesh)return;let X=W,H=$.get(W),Y=H.skeleton.bones;X.skeleton=H.skeleton.clone(),X.bindMatrix.copy(H.bindMatrix),X.skeleton.bones=Y.map(function(q){return Z.get(q)}),X.bind(X.skeleton,X.bindMatrix)}),Q}function UQ(J,$,Z){Z(J,$);for(let Q=0;Q<J.children.length;Q++)UQ(J.children[Q],$.children[Q],Z)}class N6{constructor(){this.cache={},this.refs={}}load(J,$,Z){if(this.cache[J])return this.refs[J]=(this.refs[J]||0)+1,Promise.resolve(this.cache[J]);if(!this._loader)this._loader=new O6().setMeshoptDecoder(qQ);return new Promise((Q,W)=>{this._loader.load($,(X)=>{this.cache[J]=X,this.refs[J]=(this.refs[J]||0)+1,Q(X)},(X)=>{if(Z&&X.total)Z(X.loaded/X.total)},(X)=>W(X))})}release(J){}disposeAll(){for(let J in this.cache)this.cache[J].scene.traverse((Z)=>{if(Z.geometry)Z.geometry.dispose();if(Z.material)(Array.isArray(Z.material)?Z.material:[Z.material]).forEach((W)=>{for(let X in W)if(W[X]&&W[X].isTexture)W[X].dispose();W.dispose()})}),delete this.cache[J]}}var V7=0.855,i$=3.1;class z6{constructor(J){this.renderer=new y0({canvas:J,antialias:!0,powerPreference:"high-performance",alpha:!1}),this.renderer.outputColorSpace=e7,this.scene=new c8,this.scene.background=new GJ(329485),this.scene.fog=new h$(329485,14,34),this.camera=new M7(50,1,0.1,80),this.camera.position.set(0,2.2,7.5),this.root=new T7,this.scene.add(this.root),this.ringGroup=null,this.crowd=null,this.crowdData=null,this.flags=[],this.screens=[],this.lights=null,this._crowdCursor=0,this.excite=0}applyTier(J){if(this.renderer.setPixelRatio(Math.min(J.dpr,window.devicePixelRatio||1)),this.tier=J,this.lights){if(this.lights.key.castShadow=J.shadow,J.shadow){if(this.lights.key.shadow.mapSize.set(J.shRes,J.shRes),this.lights.key.shadow.map)this.lights.key.shadow.map.dispose(),this.lights.key.shadow.map=null}}if(this.scene)this.scene.fog=J.fog?this.scene.fog||new h$(329485,14,34):null;if(this.crowd)this.crowd.count=Math.min(J.crowd,this.crowdMax);if(this.flags)this.flags.forEach((Z,Q)=>{Z.visible=Q<J.flags})}buildLights(){let J=new t8(10335448,1709072,0.75);this.scene.add(J);let $=new V$(16773848,1.6);$.position.set(4,9,3),$.castShadow=!0,$.shadow.mapSize.set(1024,1024),$.shadow.camera.left=-5,$.shadow.camera.right=5,$.shadow.camera.top=5,$.shadow.camera.bottom=-5,$.shadow.camera.far=22,$.shadow.bias=-0.0015,this.scene.add($);let Z=new V$(8959743,0.55);Z.position.set(-6,4,-5),this.scene.add(Z);let Q=new n$(16771524,0.9,9,2);Q.position.set(0,5.4,0),this.scene.add(Q),this.lights={hemi:J,key:$,rim:Z,spotGlow:Q}}async buildRing(J,$){let Z=await J.load("ring","/game/assets/box/ring.glb",$),Q=new T7,W=_6(Z.scene);W.traverse((q)=>{if(q.isMesh){if(q.castShadow=!0,q.receiveShadow=!0,q.material)(Array.isArray(q.material)?q.material:[q.material]).forEach((K)=>{K.envMapIntensity=0.5})}}),Q.add(W);let X=new y7().setFromObject(W),Y=7.5/(X.max.x-X.min.x)*0.95;return W.scale.setScalar(Y),W.position.set(-(X.min.x+X.max.x)/2*Y,-X.min.y*Y,-(X.min.z+X.max.z)/2*Y),this.root.add(Q),this.ringGroup=Q,Q}buildCrowd(J){this.crowdMax=J;let $=new u$(0.16,0.22,0.55,5,1);$.translate(0,0.28,0);let Z=new m$(0.13,5,4);Z.translate(0,0.68,0);let Q=Fq([$,Z]),W=new y9({vertexColors:!1}),X=new g$(Q,W,J);X.instanceMatrix.setUsage(y$);let H=new $7,Y=new GJ,q=new Float32Array(J*3),U=0;for(let E=0;E<4&&U<J;E++){let V=E*Math.PI/2,O=Math.floor(J/4);for(let _=0;_<8&&U<J;_++){let R=0.6+_*0.85,F=10.4+_*0.92,G=Math.ceil(O/8);for(let N=0;N<G&&U<J;N++){let z=(N-G/2)*0.62+(Math.random()-0.5)*0.18;H.position.set(Math.sin(V)*F+Math.cos(V)*z,R,Math.cos(V)*F+Math.sin(V)*z),H.rotation.y=V+Math.PI+(Math.random()-0.5)*0.2,H.scale.setScalar(0.9+Math.random()*0.25),H.updateMatrix(),X.setMatrixAt(U,H.matrix),Y.setHSL(0.55+Math.random()*0.35,0.35+Math.random()*0.3,0.28+Math.random()*0.3),X.setColorAt(U,Y),q[U*3]=Math.random()*6.28,q[U*3+1]=0.6+Math.random()*0.5,q[U*3+2]=Math.random(),U++}}}if(X.count=U,X.instanceMatrix.needsUpdate=!0,X.instanceColor)X.instanceColor.needsUpdate=!0;X.frustumCulled=!1,this.root.add(X),this.crowd=X,this.crowdData=q;let K=new y9({color:1317414});for(let E=0;E<4;E++){let V=E*Math.PI/2,O=new H7(new v9(13.5,0.5,8.4),K);O.position.set(Math.sin(V)*12.4,3.2,Math.cos(V)*12.4),O.rotation.y=V+Math.PI,O.rotation.x=-0.42,this.root.add(O)}return X}buildDressing(J){let $=document.createElement("canvas");$.width=512,$.height=128;let Z=$.getContext("2d");[["#e02020","#ffffff","#e02020"],["#0055a4","#ffffff","#ef4135"],["#12ad2b","#fcd116","#ce1126"],["#ffffff","#0038a8","#d52b1e"],["#0072ce","#ffffff","#0072ce"],["#046a38","#ffffff","#046a38"]].forEach((O,_)=>{Z.fillStyle=O[0],Z.fillRect(_*85,0,85,42),Z.fillStyle=O[1],Z.fillRect(_*85,42,85,44),Z.fillStyle=O[2],Z.fillRect(_*85,86,85,42)});let W=new g0($);W.colorSpace=e7;let X=new f7({map:W,side:j$});for(let O=0;O<10;O++){let _=O/10*Math.PI*2+0.3,R=new H7(new U$(1.5,1),X);R.position.set(Math.sin(_)*8.6,6.4+O%3*0.7,Math.cos(_)*8.6),R.rotation.y=_+Math.PI/2,R.userData.ph=Math.random()*6.28,this.root.add(R),this.flags.push(R)}let H=document.createElement("canvas");H.width=512,H.height=160;let Y=H.getContext("2d"),q=Y.createLinearGradient(0,0,512,0);q.addColorStop(0,"#0a1428"),q.addColorStop(0.5,"#16294d"),q.addColorStop(1,"#0a1428"),Y.fillStyle=q,Y.fillRect(0,0,512,160),Y.fillStyle="#ffd75e",Y.font="bold 44px sans-serif",Y.textAlign="center",Y.fillText("WORLD DOMINION",256,62),Y.fillStyle="#ff4d6d",Y.font="bold 58px sans-serif",Y.fillText("THE LAST ROUND",256,126);let U=new g0(H);U.colorSpace=e7;for(let O of[-1,1]){let _=new f7({map:U}),R=new H7(new U$(7,2.2),_);R.position.set(O*0.001+(O<0?-7.6:7.6),5.6,O*0.001),R.position.set(O<0?-7.8:7.8,5.6,0),R.rotation.y=O<0?Math.PI/2:-Math.PI/2,this.root.add(R),this.screens.push(R)}let K=new H7(new p0(20,28),new y9({color:725020}));K.rotation.x=-Math.PI/2,K.position.y=-0.02,K.receiveShadow=!0,this.root.add(K);let E=new T7,V=[5087231,16766814,1118481,5103485,16731469];for(let O=0;O<5;O++){let _=new H7(new l0(0.42,0.07,6,18),new f7({color:V[O]}));_.position.set((O-2)*0.95,0,0),E.add(_)}E.position.set(0,7.6,-8.2),this.root.add(E)}setFinalArena(J){if(this.lights)this.lights.spotGlow.intensity=J?1.5:0.9,this.lights.hemi.intensity=J?0.9:0.75;if(this.scene.fog)this.scene.fog.far=J?44:34}updateCrowd(J){if(!this.crowd)return;let $=this.t=(this.t||0)+J,Z=this.crowdData,Q=(this.tier?this.tier.crowdBob:1)*(0.6+this.excite*1.3),W=this.crowd.count,X=8;for(let H=0;H<X;H++){let Y=this._crowdCursor=(this._crowdCursor+1)%W,q=Z[Y*3],U=Z[Y*3+1];this.crowd.getMatrixAt(Y,this._md||(this._md=new AJ));let K=this._md.elements;K[13]+=Math.sin($*(2.2+Z[Y*3+2])+q)*0.05*U*Q,this.crowd.setMatrixAt(Y,this._md)}this.crowd.instanceMatrix.needsUpdate=!0,this.flags.forEach((H,Y)=>{H.rotation.z=Math.sin($*1.6+H.userData.ph)*0.08}),this.excite=Math.max(0,this.excite-J*0.25)}exciteBump(J){this.excite=Math.min(1.6,this.excite+J)}dispose(){this.scene.traverse((J)=>{if(J.geometry)J.geometry.dispose();if(J.material)(Array.isArray(J.material)?J.material:[J.material]).forEach((Z)=>{for(let Q in Z)if(Z[Q]&&Z[Q].isTexture)Z[Q].dispose();Z.dispose()})});try{this.renderer.dispose()}catch(J){}this.scene.clear()}}function Fq(J){let $=0,Z=0,Q=!0;for(let E of J)if($+=E.attributes.position.count,Z+=E.index?E.index.count:E.attributes.position.count,!E.index)Q=!1;let W=new Float32Array($*3),X=new Float32Array($*3),H=new Float32Array($*2),Y=new Uint16Array(Z),q=0,U=0;for(let E of J){let V=E.attributes.position,O=E.attributes.normal,_=E.attributes.uv;if(W.set(V.array,q*3),O)X.set(O.array,q*3);if(_)H.set(_.array,q*2);let R=E.index?E.index.array:null,F=R?R.length:E.attributes.position.count;for(let G=0;G<F;G++)Y[U+G]=(R?R[G]:G)+q;q+=E.attributes.position.count,U+=F,E.dispose()}let K=new E7;return K.setAttribute("position",new Z7(W,3)),K.setAttribute("normal",new Z7(X,3)),K.setAttribute("uv",new Z7(H,2)),K.setIndex(new Z7(Y,1)),K}var KQ={hips:"Hips_",spine:"Spine_",spine1:"Spine1_",spine2:"Spine2_",neck:"Neck_",head:"Head_",lSho:"LeftShoulder_",lArm:"LeftArm_",lFore:"LeftForeArm_",lHand:"LeftHand_",rSho:"RightShoulder_",rArm:"RightArm_",rFore:"RightForeArm_",rHand:"RightHand_",lUpLeg:"LeftUpLeg_",rUpLeg:"RightUpLeg_",lLeg:"LeftLeg_",rLeg:"RightLeg_"};class F${constructor(J,$,Z){this.arena=J,this.opts=Z,this.side=Z.side,this.pos=new T(this.side*1.6,V7,0),this.heading=0,this.root=new T7,J.root.add(this.root);let Q=$.cache.boxer.scene;this.model=_6(Q),this.model.traverse((X)=>{if(X.isMesh||X.isSkinnedMesh){if(X.castShadow=!0,X.frustumCulled=!1,X.material){let H=Array.isArray(X.material)?X.material:[X.material];this.mats=this.mats||[],H.forEach((Y)=>{let q=Y.clone();q.color=new GJ(Z.tint||16777215),this.mats.push(q),X.material=Array.isArray(X.material)?[q]:q})}}}),this.root.add(this.model),this.bones={},this.model.traverse((X)=>{if(X.isBone){for(let H in KQ)if(X.name.indexOf(KQ[H])===0){this.bones[H]=X;break}}}),this.mixer=new Q6(this.model);let W=$.cache.boxer;if(W.animations&&W.animations.length)this.baseClip=this.mixer.clipAction(W.animations[0]),this.baseClip.play(),this.baseClip.setEffectiveWeight(1);if(this.action=null,this.guardW=0,this.hitT=-1,this.dodgeT=-1,this.kdState=0,this.kdT=0,this.emote=null,this._q=new A7,this._e=new q$,this.hp=DJ.hpMax,this.st=DJ.stMax,this.guard=DJ.guardMax,this.momentum=0,this.guarding=!1,this.dodgeDir=0,this.iframe=0,this.counterT=0,this.stunT=0,this.busy=0,this.cmd=null,this.stats={thrown:0,landed:0,blocked:0,defOk:0,counters:0,dodges:0,kd:0,maxCombo:0,combo:0},this.roundScore=0,this.tint=Z.tint,this.cosmeticMeshes=[],Z.gloves)this.addGloves(Z.gloves);if(Z.shorts)this.addShorts(Z.shorts)}addGloves(J){for(let $ of["lHand","rHand"]){let Z=this.bones[$];if(!Z)continue;let Q=new H7(new m$(0.09,7,6),new y9({color:J}));Q.scale.set(1.15,1.3,0.85),Q.position.y=-0.06,Q.castShadow=!1,Z.add(Q),this.cosmeticMeshes.push(Q)}}addShorts(J){let $=this.bones.hips;if(!$)return;let Z=new H7(new u$(0.17,0.2,0.34,8,1,!0),new y9({color:J,side:j$}));Z.position.y=0.02,$.add(Z),this.cosmeticMeshes.push(Z)}setCosmetics(J,$){if(this.cosmeticMeshes.forEach((Z)=>{Z.parent.remove(Z),Z.geometry.dispose(),Z.material.dispose()}),this.cosmeticMeshes=[],J)this.addGloves(J);if($)this.addShorts($)}applyPose(J){let $=this.bones,Z=(X,H,Y,q,U)=>{if(!X||U<=0)return;this._e.set(H,Y,q),this._q.setFromEuler(this._e),X.quaternion.slerp(this._q,Math.min(1,U))},Q=performance.now()/1000;if(this.guarding&&this.kdState===0)this.guardW=Math.min(1,this.guardW+J*8);else this.guardW=Math.max(0,this.guardW-J*8);if(this.guardW>0){let X=this.guardW;Z($.lArm,-0.85,0.1,-0.55,X*0.75),Z($.rArm,-0.85,-0.1,0.55,X*0.75),Z($.lFore,-1.85,0.2,0.15,X*0.8),Z($.rFore,-1.85,-0.2,-0.15,X*0.8),Z($.spine2,0.08,0,0,X*0.5)}let W=this.action;if(W&&W.type==="punch"){let X=p7[W.kind],H=W.t/(X.startup+X.active+X.recovery),Y=X.startup/(X.startup+X.active+X.recovery),q=(X.startup+X.active)/(X.startup+X.active+X.recovery),U,K;if(H<Y)U=H/Y*0.25,K=1;else if(H<q)U=0.25+(H-Y)/(q-Y)*0.75,K=1;else U=1-(H-q)/(1-q),K=0.9*(1-(H-q)/(1-q)*0.4);U=Math.min(1,U);let E=W.kind==="hookL"||W.kind==="jab"?1:0,V=W.kind==="hookL"||W.kind==="hookR",O=W.kind==="upper",_=W.kind==="body",R=E?"lArm":"rArm",F=E?"lFore":"rFore",G=E?"lSho":"rSho",N=U,z=-0.25-N*(V?0.55:O?0.95:1.25),w=E?-1:1;Z($[G],0,0,w*0.25*(1-N),K),Z($[R],z,V?w*(0.7-N*0.9):w*0.08*(1-N),w*(V?0.5:0.12)*(1-N),K),Z($[F],V?-1.5+N*0.4:O?-1.7+N*0.9:-0.35+N*0.15,0,0,K);let k=(V?0.55:0.3)*N*w;if(Z($.spine2,O?-0.18*N:_?0.35*N:0.06*N,k,0,K),Z($.spine1,k*0.5,0,0,K*0.8),_)Z($.hips,0.3*N,0,0,K*0.6);if(O)Z($.hips,-0.15*N,0,0,K*0.5)}if(this.dodgeT>=0){this.dodgeT+=J;let X=this.dodgeT/DJ.dodgeDur;if(X>=1)this.dodgeT=-1;else{let H=Math.sin(X*Math.PI)*(this.dodgeDir||1);this.poseShiftX=H*0.42,Z($.spine2,0,0,H*0.55,0.9),Z($.head,0,0,-H*0.3,0.6),Z($.hips,0,0,H*0.12,0.5)}}if(this.poseShiftX&&this.dodgeT<0)this.poseShiftX=0;if(this.hitT>=0){this.hitT+=J;let X=this.hitT/0.34;if(X>=1)this.hitT=-1;else{let H=Math.sin(X*Math.PI);Z($.head,H*0.5,H*0.3,0,0.9),Z($.spine2,-H*0.22,0,0,0.7),this.poseShiftZ=-H*0.14}}if(this.poseShiftZ&&this.hitT<0)this.poseShiftZ=0;if(this.kdState>0){if(this.kdT+=J,this.kdState===1){let X=Math.min(1,this.kdT/0.55),H=1-Math.pow(1-X,2);if(this.root.position.y=V7-H*(V7-0.18),this.root.rotation.x=-H*1.45,Z($.hips,0,0,0,H),X>=1)this.kdState=2,this.kdT=0}else if(this.kdState===2)this.root.position.y=V7-(V7-0.18),this.root.rotation.x=-1.45;else if(this.kdState===3){let X=Math.min(1,this.kdT/0.9),H=X*X;if(this.root.position.y=V7-(1-H)*(V7-0.18),this.root.rotation.x=-(1-H)*1.45,X>=1)this.kdState=0,this.root.rotation.x=0,this.root.position.y=V7}}else this.root.rotation.x=0;if(this.emote)if(this.emote.t=(this.emote.t||0)+J,this.emote.type==="victory"){let X=Math.abs(Math.sin(this.emote.t*4))*0.12;Z($.lArm,-2.5,0,-0.4,0.85),Z($.rArm,-2.5,0,0.4,0.85),Z($.lFore,-0.4,0,0,0.7),Z($.rFore,-0.4,0,0,0.7),this.root.position.y=V7+X}else Z($.spine2,0.55,0,0,0.8),Z($.head,0.5,0,0,0.8),Z($.lArm,-0.1,0,-0.1,0.6),Z($.rArm,-0.1,0,0.1,0.6)}update(J){this.mixer.update(J),this.applyPose(J);let $=this.opp;if($&&this.kdState===0){let W=$.pos.x-this.pos.x,X=$.pos.z-this.pos.z;this.heading=Math.atan2(W,X)}let Z=this.poseShiftX||0,Q=this.poseShiftZ||0;if(this.root.position.set(this.pos.x+Z,this.pos.y,this.pos.z+Q),this.root.rotation.y=this.heading,this.action){this.action.t+=J;let W=this.action.kind;if(W&&p7[W]){let X=p7[W];if(this.action.t>=X.startup&&!this.action.fired)this.action.fired=!0,this.onActive&&this.onActive(W);if(this.action.t>=X.startup+X.active+X.recovery)this.action=null}else this.action=null}if(this.iframe>0)this.iframe-=J;if(this.counterT>0)this.counterT-=J;if(this.stunT>0)this.stunT-=J;if(this.kdState===0)this.guard=Math.min(DJ.guardMax,this.guard+4*J);if(!this.guarding&&!this.action&&this.stunT<=0)this.st=Math.min(DJ.stMax,this.st+DJ.stRegenIdle*J);else if(this.guarding)this.st=Math.max(0,this.st+DJ.stRegenGuard*J)}exhausted(){return this.st<DJ.exhaustedAt}canAct(){return this.kdState===0&&!this.action&&this.stunT<=0&&!this.emote}punch(J){let $=p7[J];if(!this.canAct()||this.st<$.stam*0.6)return!1;this.st-=$.stam;let Z=this.exhausted()?DJ.exhaustedSlow:1;return this.action={type:"punch",kind:J,t:0,slow:Z},this.stats.thrown++,!0}startDodge(J){if(this.kdState!==0||this.dodgeT>=0||this.action||this.st<DJ.dodgeStam*0.7)return!1;return this.st-=DJ.dodgeStam,this.dodgeT=0,this.dodgeDir=J,this.iframe=DJ.dodgeIframe,!0}takeHit(J,$){let Z=J;if($.guarded){if(Z*=DJ.guardDmgMul,this.guard-=J*0.85,this.guard<=0)this.guard=0,this.stunT=DJ.guardBreakStun,this.guardBreak=!0}if(this.exhausted())Z*=1.15;return this.hp=Math.max(0,this.hp-Z),this.momentum=Math.max(0,this.momentum-DJ.momHitTaken),this.hitT=-0.001,this.stats.combo=0,Z}resetRound(){this.guard=DJ.guardMax,this.st=Math.min(DJ.stMax,this.st+35),this.action=null,this.stunT=0,this.hitT=-1,this.dodgeT=-1,this.guarding=!1,this.kdState=0,this.root.rotation.x=0,this.root.position.y=V7}dispose(){this.arena.root.remove(this.root),this.mixer.stopAllAction(),this.mats=this.mats||[],this.mats.forEach((J)=>J.dispose()),this.cosmeticMeshes.forEach((J)=>{J.geometry.dispose(),J.material.dispose()}),this.cosmeticMeshes=[]}}var O$=(J)=>String(J).replace(/\d/g,($)=>"۰۱۲۳۴۵۶۷۸۹"[$]);class EQ{constructor(J,$,Z){this.p=J,this.rng=$,this.diff=Z||1,this.defOnly=!1,this.state="IDLE",this.thinkT=0,this.comboQueue=[],this.comboT=0,this.mem={punches:[],body:0,dodges:0,counters:0,passiveT:0},this.caution=0}sk(J){return Math.min(0.97,J*this.diff)}notePlayer(J,$){let Z=this.mem;if(J==="punch"){if(Z.punches.push($),Z.punches.length>14)Z.punches.shift();if($==="body")Z.body++}else if(J==="dodge")Z.dodges++;else if(J==="counter")Z.counters++}think(J,$,Z,Q){if(this.thinkT-=J,this.thinkT>0)return;this.thinkT=0.12+this.rng()*0.05;let W=Math.abs($.pos.z-Z.pos.z),X=this.mem;if(X.counters>=3)this.caution=Math.min(1,this.caution+0.15);let H=X.passiveT>3.2,Y=Math.min(1.15,this.p.aggr*(H?1.35:1)*($.st<25?0.6:1)*(1-this.caution*0.45)),q=$.hp-Z.hp,U="KEEP_DISTANCE";if($.hp<=0||$.kdState!==0)U="IDLE";else if($.exhausted())U="RETREAT";else if($.stunT>0)U="STAGGER";else if(this.state==="DESPERATE"||$.hp<22&&Z.hp>45&&this.rng()<0.5)U="DESPERATE";else if(Z.hp<=DJ.finisherHp&&$.momentum>55)U="FINISHING";else if(W>2.2)U=Y>0.35?"APPROACH":"KEEP_DISTANCE";else if(W<1.15)U=this.p.style==="defensive"?"KEEP_DISTANCE":"ATTACK";else if(Y>0.55&&this.rng()<0.5)U="ATTACK";else if(this.rng()<this.sk(this.p.counter)*0.3&&Z.action)U="COUNTER";else if(this.rng()<this.sk(this.p.guard)*0.35)U="DEFEND";else U=this.rng()<0.5?"ATTACK":"KEEP_DISTANCE";if(q<-30&&this.rng()<0.3)U="DESPERATE";switch(this.state=U,U){case"APPROACH":this.moveToward($,Z,J);break;case"KEEP_DISTANCE":{if(W<1.5)this.cmd($,{t:"back"});else if(this.rng()<0.3)this.cmd($,{t:"strafe",dir:this.rng()<0.5?-1:1});break}case"RETREAT":this.cmd($,{t:"back"});break;case"ATTACK":case"DESPERATE":case"FINISHING":{if(this.defOnly){this.moveToward($,Z,J);break}let K=this.rng(),E="jab";if(K<0.34)E="jab";else if(K<0.55)E="cross";else if(K<0.72)E=this.rng()<0.5?"hookL":"hookR";else if(K<0.82)E="body";else E="upper";if(U==="DESPERATE")E=this.rng()<0.6?"upper":this.rng()<0.5?"hookL":"hookR";if(this.rng()<this.sk(this.p.combo)*0.5){this.comboQueue=[E];let V=1+Math.floor(this.rng()*2);for(let O=0;O<V;O++)this.comboQueue.push(d0[Math.floor(this.rng()*3)]);this.comboT=0.05}else this.cmd($,{t:"punch",kind:E});break}case"DEFEND":this.cmd($,{t:"guardOn"}),this._guardOffAt=0.5+this.rng()*0.7;break;case"COUNTER":this.cmd($,{t:"guardOn"});break;case"STAGGER":this.cmd($,{t:"back"});break;default:break}if(Z.action&&Z.action.type==="punch"&&!Z.action._aiSeen&&Z.action.t<0.1){Z.action._aiSeen=!0;let K=this.rng(),E=this.sk(this.p.dodge),V=this.sk(this.p.guard),O=this.sk(this.p.counter)*(1-this.caution*0.3);if(K<E*0.42)this.cmd($,{t:"dodge",dir:this.rng()<0.5?-1:1});else if(K<E*0.42+V*0.75)this.cmd($,{t:"guardOn"});else if(K<E*0.42+V*0.75+O*0.35)this.cmd($,{t:"dodge",dir:this.rng()<0.5?-1:1})}if(this.comboQueue.length&&this.comboT<=0&&!$.action&&$.stunT<=0&&!this.defOnly){let K=this.comboQueue.shift();this.cmd($,{t:"punch",kind:K}),this.comboT=0.14}if(this.comboT-=J,$.guarding&&!Z.action&&(U==="ATTACK"||U==="APPROACH"))this.cmd($,{t:"guardOff"})}moveToward(J,$,Z){if(Math.abs(J.pos.z-$.pos.z)>1.7)this.cmd(J,{t:"fwd"});else if(this.rng()<0.25)this.cmd(J,{t:"strafe",dir:this.rng()<0.5?-1:1})}cmd(J,$){if(J.cmdQueue.length<3)J.cmdQueue.push($)}}class o${constructor(J,$){this.env=J,this.opts=$,this.mode=$.mode,this.phase="IDLE",this.phaseT=0,this.round=0,this.rounds=$.rounds||DJ.rounds,this.roundLen=$.roundLen||DJ.roundLen,this.restLen=$.restLen!=null?$.restLen:DJ.restLen,this.clock=0,this.time=0,this.teach=!!$.teach,this.buffs=$.buffs||{},this.kdRing=null,this.finisherUsed=!1,this.flashKd={p:!1,a:!1},this.decision=[0,0],this.result=null,this.paused=!1,this.hintSent={},this.punchLog=[],this.atkLog=[],this.kdLog=[],this._dt=0.016;let Z=J.arena;if(this.player=new F$(Z,J.assets,{side:-1,tint:$.playerTint,gloves:$.playerGloves,shorts:$.playerShorts,name:$.playerName}),this.ai=new F$(Z,J.assets,{side:1,tint:$.aiProfile.tint,gloves:$.aiProfile.gloves,shorts:$.aiProfile.shorts,name:$.aiProfile.name,isCyborg:$.aiProfile.cyborg}),this.player.opp=this.ai,this.ai.opp=this.player,this.player.onActive=(Q)=>this.resolvePunch(this.player,Q),this.ai.onActive=(Q)=>this.resolvePunch(this.ai,Q),this.player.cmdQueue=[],this.ai.cmdQueue=[],this.plan=null,this.mode==="spar")this.plan=this.buildPlan();this.aiBrain=new EQ($.aiProfile,$.rng||Math.random,$.aiDiff||1),this.aiBrain.defOnly=this.mode==="spar",this.planIdx=0,this.player.pos.set(0,V7,-1.6),this.ai.pos.set(0,V7,1.6)}buildPlan(){let J=this.opts.seedRng,$=[];for(let Z=0;Z<this.rounds;Z++){let Q=7+Math.floor(J()*4),W=[],X=2.5+J()*2.5;for(let H=0;H<Q;H++){let Y=d0[Math.floor(J()*6)];if(W.push({t:X,kind:Y}),X+=2.4+J()*2.6,X>this.roundLen-1)break}$.push(W)}return $}start(){this.phase="INTRO",this.phaseT=0,this.env.cam.to("INTRO",3.2),this.env.audio.setMode("menu"),this.env.hud.showFighters(this.opts.playerName,this.opts.aiProfile.name,this.opts.aiProfile.flag),this.env.hud.roundCard(this.opts.aiProfile.name||"SPAR",this.mode==="spar"?"جلسه‌ی بوکس رسمی — ۳ راند":this.opts.aiProfile.title||"",2.6)}command(J){if(this.phase!=="FIGHT"||this.paused)return;let $=this.player;if(J.t==="guardOn"){if($.guarding=!0,this.teach&&!this.hintSent.g)this.hintSent.g=1}else if(J.t==="guardOff")$.guarding=!1;else if(J.t==="dodge"){if($.startDodge(J.dir))this.aiBrain.notePlayer("dodge")}else if(J.t==="backstep"){if($.canAct())$.pos.z=Math.max(-i$,$.pos.z-0.4)}else if(J.t==="punch")this.tryPunch($,J.kind,!0);else if(J.t==="finisher")this.tryFinisher()}tryPunch(J,$,Z){let Q=p7[$];if(!J)return!1;if(J.guarding)J.guarding=!1;let W=J.punch($);if(W){if(Z)this.aiBrain.notePlayer("punch",$);this.env.audio.whoosh(Q.dmg>=12)}return W}tryFinisher(){let J=this.player,$=this.ai;if(this.finisherUsed||J.momentum<DJ.finisherMom||$.hp>DJ.finisherHp||J.kdState!==0||this.phase!=="FIGHT")return!1;this.finisherUsed=!0,this.env.ts.slow(0.45,1.1),this.env.cam.knockdown(),this.env.hud.comboPop("FINISHER!","#ffd75e");let Z=["upper","hookR","cross"],Q=(W)=>{if(W>=Z.length||this.phase!=="FIGHT"||this.result)return;if(Math.abs(J.pos.z-$.pos.z)>1.8)J.pos.z=$.pos.z-1.5;this.tryPunch(J,Z[W],!0),setTimeout(()=>Q(W+1),420)};return Q(0),!0}movePlayer(J){if(this.phase!=="FIGHT"||this.paused)return;let $=this.player;if($.kdState!==0||$.stunT>0)return;let Z=$.exhausted()?1.05:1.65;$.pos.z=Math.max(-i$,Math.min(i$-0.3,$.pos.z-J*Z*this._dt))}resolvePunch(J,$){let Z=J.opp,Q=p7[$],W=Math.abs(J.pos.z-Z.pos.z),X={kind:$,t:this.time,res:0,dmg:0,guarded:!1,counter:!1};if(W>Q.reach+0.25)X.res=0,this.momentumAdd(J,-DJ.momWhiff*0.4);else if(Z.iframe>0)X.res=0,Z.stats.dodges++,Z.counterT=DJ.counterWin,this.momentumAdd(Z,DJ.momDodgePerf*0.6);else if(Z.kdState!==0)X.res=2,X.dmg=Q.dmg*0.5,Z.takeHit(X.dmg,{});else{let H=Z.guarding&&(Q.h===1||Math.random()<0.35),Y=Q.dmg*(J===this.player&&this.buffs.dmg?1.08:1)*(1+J.momentum/100*DJ.momDmgBonus)*(J.exhausted()?DJ.exhaustedDmg:1);if(X.guarded=H,H)X.res=1,X.dmg=Y,Z.takeHit(Y,{guarded:!0,body:Q.h===0}),this.env.audio.block(),Z.stats.blocked++,this.momentumAdd(Z,2);else{X.res=2;let q=J.counterT>0||J.action&&J.action._counterWish;X.counter=!!q;let U=Y*(X.counter?DJ.counterMul:1);if(X.dmg=U,Z.takeHit(U,{body:Q.h===0}),Q.stamDmg)Z.st=Math.max(0,Z.st-Q.stamDmg);if(J.stats.landed++,X.counter)J.stats.counters++,this.momentumAdd(J,DJ.momCounter),this.env.hud.comboPop("کانتر!","#7dff9e");else this.momentumAdd(J,Q.dmg>=12?DJ.momHitClean:DJ.momHitClean*0.7);if(J.stats.combo++,J.stats.maxCombo=Math.max(J.stats.maxCombo,J.stats.combo),J.stats.combo>=3)this.momentumAdd(J,4);J.roundScore+=Q.score*(X.counter?1.6:1);let K=U>=11;this.env.audio.impact(K);let E=Z.pos.x+(Math.random()-0.5)*0.3;if(this.env.vfx.burst(E,Q.h===1?1.55:1.05,Z.pos.z-Z.side*-0.25,K?14:7,K?16766814:16773848,K?2.6:1.6,K?2.2:1.2),this.env.cam.impact(K?0.24:0.1),this.env.arena.exciteBump(K?0.25:0.1),this.env.haptic(K?24:10),K)this.env.ts.slow(0.75,0.12);if(Z.guardBreak)Z.guardBreak=!1,this.env.hud.comboPop("گارد شکست!","#ff8ba0");if(Z.guard===0&&U>=12&&!this.flashKd[Z===this.player?"p":"a"]&&Z.kdState===0)this.flashKd[Z===this.player?"p":"a"]=!0,this.beginKnockdown(Z);if(Z.hp<=0&&Z.kdState===0)this.beginKnockdown(Z)}}if(X.dmg=Math.round(X.dmg*100)/100,J===this.player)this.punchLog.push({kind:$,t:X.t,res:X.res,dmg:X.dmg,counter:X.counter}),this.ev("p",X.t,Q.id,X.res,X.dmg,X.counter?1:0);else if(X.planIdx!=null)this.atkLog.push({t:X.t,idx:X.planIdx,res:X.res}),this.ev("atk",X.t,X.planIdx,X.res,0);if(J===this.player&&X.counter)this.aiBrain.notePlayer("counter");return X}momentumAdd(J,$){J.momentum=Math.max(0,Math.min(100,J.momentum+$))}beginKnockdown(J){if(this.phase==="KD")return;let $=J===this.player;if(J.kdState=1,J.kdT=0,J.stats.kd++,this.kdWho=$?0:1,this.kdCount=0,this.phase="KD",this.phaseT=0,this.env.ts.slow(0.35,0.9),this.env.cam.knockdown(),this.env.audio.bellEnd(),this.env.arena.exciteBump(1),this.momentumAdd($?this.ai:this.player,DJ.momKd),this.kdLog.push({t:this.time,who:$?0:1}),this.ev("kd",this.time,$?0:1,0),this.env.hud.roundCard($?"DOWN!":"ناک‌داون!",$?"برای برگشتن بزن!":"حریف زمین خورد",1.6),$)this.env.hud.knockUI(!0,0),this.kdRing={t:0,dir:1,pos:0.5,speed:1.15+(1-this.player.hp/100)*0.7,ok:0,fail:0};else this._aiGetupNeed=1+(this.opts.aiProfile.cyborg?0:Math.floor((this.opts.aiDiff||1)*1.5))}knockTap(){if(!this.kdRing||this.phase!=="KD"||this.kdWho!==0)return;let J=this.kdRing;if(Math.abs(J.pos-0.5)<0.16){if(J.ok++,this.env.audio.cheer(!1),this.env.hud.knockUI(!0,J.ok),J.ok>=DJ.kdGetupTaps)this.env.hud.knockUI(!1,0),this.kdRing=null,this.doGetup(this.player)}else if(J.fail++,this.kdCount++,this.env.hud.knockUI(!0,J.ok,!0),J.fail>=3)this.env.hud.knockUI(!1,0),this.kdRing=null,this.koFinish(this.ai)}doGetup(J){if(J.kdState=3,J.kdT=0,J.st=Math.max(J.st,30),J.momentum=Math.max(0,J.momentum-25),J.guard=DJ.guardMax,this.phase="FIGHT",this.env.cam.gameplay(),J===this.player)this.env.hud.roundCard("برگشتی!","ادامه بده",1.2);this.ev("kd",this.time,J===this.player?0:1,1)}koFinish(J){let $=J.opp;$.kdState=2,this.finish(J,!0)}update(J){if(this.paused||this.result)return;let $=this.env.ts.update(J),Z=J*$;this._dt=Z,this.time+=Z,this.phaseT+=Z;let Q=this.player,W=this.ai;if(this.phase==="FIGHT")this.aiBrain.think(Z,W,Q,this),this.applyCommands(W,Z),this.applyCommands(Q,Z);Q.update(Z),W.update(Z);let X=W.pos.z-Q.pos.z;if(Math.abs(X)<0.95&&Q.kdState===0&&W.kdState===0){let H=(0.95-Math.abs(X))/2*(X>=0?1:-1);W.pos.z+=H,Q.pos.z-=H}if(W.guarding&&W._guardOffAt!=null){if(W._guardOffAt-=Z,W._guardOffAt<=0)W.guarding=!1,W._guardOffAt=null}switch(this.phase){case"INTRO":{if(this.phaseT>(this.mode==="spar"?2.6:4.2))this.nextRound(1);break}case"ROUND_CARD":{if(this.phaseT>1.8){if(this.phase="FIGHT",this.phaseT=0,this.clock=this.roundLen,this.env.cam.gameplay(),this.env.audio.setMode(this.round>=this.rounds?"final":"gameplay"),this.env.audio.bell(),this.round>=this.rounds)this.env.cam.to("FINAL_ROUND");if(this.teach&&!this.hintSent.r1)this.hintSent.r1=1,this.env.hud.hint("تپ=جب • دبل‌تپ=کراس • سوایپ چپ/راست=داوج • نگه‌دار=گارد")}break}case"FIGHT":{if(this.clock-=Z,this.plan&&this.planIdx<this.plan[this.round-1].length){let H=this.plan[this.round-1][this.planIdx];if(this.roundLen-this.clock>=H.t){let Y=this.planIdx;if(this.planIdx++,Math.abs(W.pos.z-Q.pos.z)<=p7[H.kind].reach+0.4&&W.canAct()){if(this.tryPunch(W,H.kind,!1),W.action)W.action.planIdx=Y}}}if(this.clock<=0)this.endRound();break}case"REST":{if(this.phaseT>this.restLen)this.nextRound(this.round+1);break}case"KD":{if(this.kdWho===1&&W.kdState===2){if(this.phaseT>1.2+this._aiGetupNeed*0.8)if(W.hp<=6&&!this.opts.aiProfile.cyborg&&this.aiBrain.rng()<0.25)this.koFinish(Q);else this.doGetup(W)}if(this.kdWho===0&&this.kdRing){let H=this.kdRing;if(H.t+=Z,H.pos+=H.dir*H.speed*Z,H.pos>1)H.pos=1,H.dir=-1;if(H.pos<0)H.pos=0,H.dir=1;if(this.env.hud.knockRing(H.pos),this.kdCount>=9)this.env.hud.knockUI(!1,0),this.kdRing=null,this.koFinish(W);else if(H.t>3.4){if(H.t=0,this.kdCount++,this.kdCount>=9)this.env.hud.knockUI(!1,0),this.kdRing=null,this.koFinish(W)}}break}case"VERDICT":{if(this.phaseT>(this.mode==="spar"?2.2:3.4))this.finish(this._winner,this._byKo);break}default:break}if(this.phase==="FIGHT"){let H=0.22+Q.momentum/150+(W.hp<35?0.2:0)+(Q.hp<35?0.1:0);this.env.audio.setIntensity(Math.min(1,H))}}applyCommands(J,$){let Z=J.cmdQueue;while(Z.length){let Q=Z.shift();if(Q.t==="punch")this.tryPunch(J,Q.kind,!1);else if(Q.t==="guardOn")J.guarding=!0;else if(Q.t==="guardOff")J.guarding=!1;else if(Q.t==="dodge")J.startDodge(Q.dir);else if(Q.t==="fwd")J.pos.z-=1.15*$*(J.exhausted()?0.6:1);else if(Q.t==="back")J.pos.z+=1.25*$*(J.exhausted()?0.55:1);else if(Q.t==="strafe")J.pos.x=Math.max(-2.2,Math.min(2.2,J.pos.x+Q.dir*1*$))}}nextRound(J){if(this.round=J,J>this.rounds){this.verdictByDecision();return}this.phase="ROUND_CARD",this.phaseT=0,this.player.resetRound(),this.ai.resetRound(),this.planIdx=0,this.env.hud.roundCard("راند "+O$(J),J===this.rounds?"راند آخر — همه‌چیز عوض می‌شود":"",1.7),this.env.cam.to("ROUND_START",1.6),this.ev("bell",this.time,J)}endRound(){this.env.audio.bellEnd();let J=Math.round(this.player.roundScore),$=Math.round(this.ai.roundScore);if(J>$)this.decision[0]+=10,this.decision[1]+=9,this.momentumAdd(this.player,15);else if($>J)this.decision[0]+=9,this.decision[1]+=10,this.momentumAdd(this.ai,15);else this.decision[0]+=10,this.decision[1]+=10;this.ev("rl",this.time,this.round,this.player.stats.thrown,this.player.stats.landed,this.player.stats.blocked+this.player.stats.dodges,this.player.stats.kd,this.ai.stats.kd),this.flashKd={p:!1,a:!1},this.player.roundScore=0,this.ai.roundScore=0,this.phase="REST",this.phaseT=0,this.env.audio.setMode("rest"),this.env.hud.coach(this.coachLine()),this.env.cam.to("CORNER",this.restLen)}coachLine(){let J=this.player.stats,$=J.thrown?J.landed/J.thrown:0,Z=this.opts.coach||{};if(J.kd>=1)return Z.kd||"«بلند شدی. حالا با عقل بجنگ.»";if(J.thrown>=6&&$<0.25)return Z.acc||"«هدر نده — هر ضربه قیمت دارد.»";if(J.combo>=3)return Z.combo||"«همین ترکیب را نگه دار!»";if(this.player.st<30)return Z.stam||"«نفست را هدر ندهی، می‌بری.»";if(J.blocked+J.dodges===0&&J.landed>=3)return Z.def||"«دفاع یادت رفت — گارد بالا!»";return Z.generic||"«یکی می‌ماند. آرام باش.»"}verdictByDecision(){let J=this.decision[0]>this.decision[1],$=J?this.player:this.ai;this.env.hud.roundCard("پایان مسابقه","به داوری — "+(J?"کارت‌ها به سود تو":"کارت‌ها به سود حریف"),2.2),this.finish($,!1)}finish(J,$){if(this.result)return;this.phase="VERDICT",this.phaseT=0,this._winner=J,this._byKo=$;let Z=J===this.player;if(this.env.hud.roundCard(Z?"پیروزی!":"باخت",$?"با ناک‌اوت":"با داوری",2.4),Z)this.player.emote={type:"victory"},this.ai.emote={type:"defeat"},this.env.cam.to("VICTORY",3.2),this.env.audio.cheer(!0),this.env.arena.exciteBump(1.5);else this.player.emote={type:"defeat"},this.ai.emote={type:"victory"},this.env.cam.to("DEFEAT",3.2);this.env.audio.bellEnd(),this.ev("end",this.time,Z?1:0,$?1:0),setTimeout(()=>this.finishFinal(Z,$),this.mode==="spar"?2200:3200)}finishFinal(J,$){if(this.result)return;this.result={verdict:J?1:0,byKo:$,rounds:this.rounds,decision:this.decision.slice(),stats:{thrown:this.player.stats.thrown,landed:this.player.stats.landed,blocked:this.player.stats.blocked,dodges:this.player.stats.dodges,counters:this.player.stats.counters,kd:this.player.stats.kd,kdTaken:this.ai.stats.kd,maxCombo:this.player.stats.maxCombo},durMs:Math.round(this.time*1000),scoreLocal:this.computeScore()},this.opts.onEnd&&this.opts.onEnd(this.result)}computeScore(){let J=0,$=0,Z=-9;for(let W of this.punchLog){let X=p7[W.kind];if(!X)continue;if(W.res===2){if(J+=Math.round(X.score*(W.counter?1.6:1)),W.t-Z<1.1){if($++,$>=3)J+=5}else $=1;Z=W.t}else if(W.res===1)J+=3}for(let W of this.atkLog)if(W.res===1)J+=4;else if(W.res===3)J+=6;let Q=this.kdLog.filter((W)=>W.who===1).length;if(J+=Math.min(3,Q)*40,this.result?this.result.verdict:this.decision[0]>this.decision[1])J+=120;return Math.max(0,Math.round(J))}ev(){if(this.mode!=="spar"||!this.opts.onEvent)return;let J=Array.prototype.slice.call(arguments);J[1]=Math.round((Number(J[1])||0)*1000);try{this.opts.onEvent.apply(null,J)}catch($){}}destroy(){this.player.dispose(),this.ai.dispose()}}class a${constructor(J,$){this.hooks=$,this.canvas=J,this._moved=!1,this._sx=0,this._sy=0,this._st=0,this._holdTm=0,this._holding=!1,this._lastTap=0,this._side="right",this._moving=!1,this._moveAxis=0,this._kb={},this.onKeyDown=(Z)=>{if(this._kb[Z.code])return;switch(this._kb[Z.code]=1,this.hooks.anyInput&&this.hooks.anyInput(),Z.code){case"KeyJ":$.cmd({t:"punch",kind:"jab"});break;case"KeyK":$.cmd({t:"punch",kind:"cross"});break;case"KeyU":$.cmd({t:"punch",kind:"hookL"});break;case"KeyI":$.cmd({t:"punch",kind:"hookR"});break;case"KeyO":$.cmd({t:"punch",kind:"upper"});break;case"KeyL":$.cmd({t:"punch",kind:"body"});break;case"KeyQ":$.cmd({t:"dodge",dir:-1});break;case"KeyE":$.cmd({t:"dodge",dir:1});break;case"Space":$.cmd({t:"guardOn"}),Z.preventDefault();break;case"KeyF":$.cmd({t:"finisher"});break;case"KeyX":$.cmd({t:"backstep"});break}},this.onKeyUp=(Z)=>{if(this._kb[Z.code]=0,Z.code==="Space")$.cmd({t:"guardOff"})},window.addEventListener("keydown",this.onKeyDown,{passive:!1}),window.addEventListener("keyup",this.onKeyUp),this.pd=(Z)=>{Z.preventDefault();let Q=J.getBoundingClientRect();if(this._sx=Z.clientX-Q.left,this._sy=Z.clientY-Q.top,this._st=performance.now(),this._moved=!1,this._side=this._sx<Q.width*0.42?"left":"right",clearTimeout(this._holdTm),this._holdTm=setTimeout(()=>{if(!this._moved&&this._st&&performance.now()-this._st>=260)this._holding=!0,$.cmd({t:"guardOn"}),$.haptic&&$.haptic(8)},264),this.hooks.knockTap)this.hooks.knockTap();$.anyInput&&$.anyInput()},this.pm=(Z)=>{if(!this._st)return;let Q=J.getBoundingClientRect(),W=Z.clientX-Q.left,X=Z.clientY-Q.top,H=W-this._sx,Y=X-this._sy;if(Math.abs(H)>26||Math.abs(Y)>26){if(!this._moved){if(this._moved=!0,clearTimeout(this._holdTm),this._holding)this._holding=!1,$.cmd({t:"guardOff"});if(this._side==="left")this._moving=!0,this._moveAxis=Math.max(-1,Math.min(1,Y/60));else{if(Math.abs(H)>Math.abs(Y))if(Y<-34)$.cmd({t:"punch",kind:H<0?"hookL":"hookR"});else $.cmd({t:"dodge",dir:H<0?-1:1});else if(Y<0)$.cmd({t:"punch",kind:"upper"});else $.cmd({t:"punch",kind:"body"});this._st=0}}else if(this._moving&&this._side==="left")this._moveAxis=Math.max(-1,Math.min(1,Y/60))}},this.pu=(Z)=>{if(clearTimeout(this._holdTm),this._holding)this._holding=!1,$.cmd({t:"guardOff"});if(this._st&&!this._moved){let Q=performance.now();if(Q-this._st<260&&this._side==="right")if(Q-this._lastTap<340)$.cmd({t:"punch",kind:"cross"}),this._lastTap=0;else $.cmd({t:"punch",kind:"jab"}),this._lastTap=Q}this._st=0,this._moving=!1,this._moveAxis=0},J.addEventListener("pointerdown",this.pd,{passive:!1}),J.addEventListener("pointermove",this.pm,{passive:!1}),J.addEventListener("pointerup",this.pu,{passive:!1}),J.addEventListener("pointercancel",this.pu,{passive:!1}),this._kbLoop=setInterval(()=>{if(this._moving&&this._moveAxis)$.move(this._moveAxis);else if(this._kb.KeyW||this._kb.ArrowUp)$.move(-1);else if(this._kb.KeyS||this._kb.ArrowDown)$.move(1)},33)}dispose(){if(window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),clearInterval(this._kbLoop),clearTimeout(this._holdTm),this.canvas)this.canvas.removeEventListener("pointerdown",this.pd),this.canvas.removeEventListener("pointermove",this.pm),this.canvas.removeEventListener("pointerup",this.pu),this.canvas.removeEventListener("pointercancel",this.pu)}}class n0{constructor(){this.el=null,this.refs={},this._last={},this._hudT=0}mount(J){this.unmount();let $=document.createElement("div");$.className="b5-hud",$.innerHTML='<div class="b5-top">'+'<div class="b5-name l" id="b5-pn">تو</div>'+'<div class="b5-barwrap pl"><div class="b5-bar" id="b5-php"></div><div class="b5-bar" id="b5-pst"></div><div class="b5-bar" id="b5-pmom"></div></div><div class="b5-mid" id="b5-round"></div><div class="b5-barwrap ai"><div class="b5-bar" id="b5-ahp"></div><div class="b5-bar" id="b5-ast"></div></div>'+'<div class="b5-name r" id="b5-an">حریف</div>'+'</div><div class="b5-clock" id="b5-clock"></div><div class="b5-card" id="b5-card" style="display:none"><div class="b5-card-t" id="b5-card-t"></div><div class="b5-card-s" id="b5-card-s"></div></div><div class="b5-combo" id="b5-combo"></div><div class="b5-coach" id="b5-coach" style="display:none"></div><div class="b5-knock" id="b5-knock" style="display:none"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="b5-kring"/><circle cx="60" cy="60" r="20" class="b5-kzone"/><circle id="b5-kmark" cx="60" cy="8" r="8" class="b5-kmark"/></svg><div class="b5-klabel" id="b5-klabel"></div></div>'+'<button class="b5-fin" id="b5-fin" style="display:none">⚡ FINISHER</button>'+'<div class="b5-hint" id="b5-hint"></div>',J.appendChild($),this.el=$;let Z=(Q)=>$.querySelector("#"+Q);this.refs={pn:Z("b5-pn"),an:Z("b5-an"),php:Z("b5-php"),pst:Z("b5-pst"),pmom:Z("b5-pmom"),ahp:Z("b5-ahp"),ast:Z("b5-ast"),round:Z("b5-round"),clock:Z("b5-clock"),card:Z("b5-card"),cardT:Z("b5-card-t"),cardS:Z("b5-card-s"),combo:Z("b5-combo"),coach:Z("b5-coach"),knock:Z("b5-knock"),kmark:Z("b5-kmark"),klabel:Z("b5-klabel"),fin:Z("b5-fin"),hint:Z("b5-hint")}}showFighters(J,$,Z){this.refs.pn.textContent=J||"تو",this.refs.an.textContent=(Z?Z+" ":"")+($||"حریف")}tick(J,$){if(this._hudT-=J,this._hudT>0)return;this._hudT=0.1;let Z=this.refs;if(!Z.php)return;let Q=Math.max(0.001,$.player.hp/DJ.hpMax),W=Math.max(0.001,$.ai.hp/DJ.hpMax),X=Math.max(0,$.player.st/DJ.stMax),H=Math.max(0,$.ai.st/DJ.stMax),Y=Math.max(0,$.player.momentum/100);Z.php.style.transform="scaleX("+Q.toFixed(3)+")",Z.ahp.style.transform="scaleX("+W.toFixed(3)+")",Z.pst.style.transform="scaleX("+X.toFixed(3)+")",Z.ast.style.transform="scaleX("+H.toFixed(3)+")",Z.pmom.style.transform="scaleX("+Y.toFixed(3)+")",Z.php.classList.toggle("low",Q<0.3),Z.ahp.classList.toggle("low",W<0.3),Z.pst.classList.toggle("low",X<0.2);let q="راند "+O$(Math.max(1,$.round))+"/"+O$($.rounds);if(this._last.round!==q)this._last.round=q,Z.round.textContent=q;let U="۰:"+O$(String(Math.max(0,Math.ceil($.clock))).padStart(2,"0"));if(this._last.clock!==U)this._last.clock=U,Z.clock.textContent=U;let K=$.phase==="FIGHT"&&$.player.momentum>=DJ.finisherMom&&$.ai.hp<=DJ.finisherHp&&!$.finisherUsed;if(this._last.fin!==K)this._last.fin=K,Z.fin.style.display=K?"":"none"}roundCard(J,$,Z){let Q=this.refs;if(!Q.card)return;Q.cardT.textContent=J,Q.cardS.textContent=$||"",Q.card.style.display="",Q.card.classList.remove("b5-in"),Q.card.offsetWidth,Q.card.classList.add("b5-in"),clearTimeout(this._cardTm),this._cardTm=setTimeout(()=>{if(Q.card)Q.card.style.display="none"},(Z||2)*1000)}comboPop(J,$){let Z=this.refs.combo;if(!Z)return;Z.textContent=J,Z.style.color=$||"#ffd75e",Z.classList.remove("b5-pop"),Z.offsetWidth,Z.classList.add("b5-pop")}coach(J){let $=this.refs.coach;if(!$)return;$.textContent="\uD83E\uDDD1‍\uD83C\uDFEB مربی: "+J,$.style.display="",clearTimeout(this._coachTm),this._coachTm=setTimeout(()=>{if($)$.style.display="none"},4200)}hint(J){if(this.refs.hint)this.refs.hint.textContent=J||""}knockUI(J,$,Z){let Q=this.refs;if(!Q.knock)return;if(Q.knock.style.display=J?"":"none",Q.klabel.textContent=$?O$($)+"/"+O$(3)+" — ادامه بده":"برای برگشتن — در حلقه بزن!",Z)Q.klabel.style.color="#ff8ba0",setTimeout(()=>{if(Q.klabel)Q.klabel.style.color=""},220)}knockRing(J){if(!this.refs.kmark)return;let $=J*Math.PI*2,Z=52;this.refs.kmark.setAttribute("cx",(60+Math.cos($)*Z).toFixed(1)),this.refs.kmark.setAttribute("cy",(60+Math.sin($)*Z).toFixed(1))}unmount(){if(clearTimeout(this._cardTm),clearTimeout(this._coachTm),this.el&&this.el.parentNode)this.el.parentNode.removeChild(this.el);this.el=null,this.refs={},this._last={}}}var G7=(J)=>String(J).replace(/\d/g,($)=>"۰۱۲۳۴۵۶۷۸۹"[$]),R$=(J)=>String(J==null?"":J).replace(/[&<>"']/g,($)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[$]),r$={rafa:{key:"rafa",name:"رافا مورنو",nick:"چکش",title:"«چکش» — حریف کوالیفایر",flag:"\uD83C\uDDF2\uD83C\uDDFD",country:"mx",style:"pressure",tint:13144702,gloves:1710618,shorts:2845247,aggr:0.5,guard:0.3,dodge:0.22,counter:0.15,stamEff:0.5,combo:0.25,adapt:0.15,taunt:"برای المپیک خیلی جوانی، بچه.",bio:"خطرناک ولی شکست‌پذیر — درس اول: حرکت، گارد، جب، نفَس."},mateo:{key:"mateo",name:"ماتئو سیلوا",nick:"دیوار",title:"«دیوار» — ضرب‌گیرِ سرد",flag:"\uD83C\uDDE7\uD83C\uDDF7",country:"br",style:"defensive",tint:9069128,gloves:15263976,shorts:1920728,aggr:0.28,guard:0.88,dodge:0.5,counter:0.85,stamEff:0.85,combo:0.3,adapt:0.5,taunt:"به تو احترام می‌گذارم — ولی هنوز آماده نیستی.",bio:"تمیز نمی‌خوری‌اش؛ بعد از گاردِ سنگین، برگردش کند است."},nikolai:{key:"nikolai",name:"نیکولای وُلکوف",nick:"تپ آهنین",title:"«تپ آهنین» — ماشین فشار",flag:"\uD83C\uDDF7\uD83C\uDDFA",country:"ru",style:"pressure",tint:11121602,gloves:11538986,shorts:1120295,aggr:0.92,guard:0.5,dodge:0.32,counter:0.4,stamEff:0.28,combo:0.6,adapt:0.35,taunt:"استقامت، استعداد را می‌بلعد.",bio:"مدام جلو می‌آید — اگر هول کنی نفست تمام می‌شود."},yusuf:{key:"yusuf",name:"یوسف دمیر",nick:"سندان",title:"«سندان» — نیمه‌نهایی",flag:"\uD83C\uDDF9\uD83C\uDDF7",country:"tr",style:"technical",tint:11569512,gloves:9183023,shorts:16053492,aggr:0.62,guard:0.72,dodge:0.62,counter:0.7,stamEff:0.78,combo:0.5,adapt:0.7,taunt:"آناتولی کارخانه‌ی قهرمان است.",bio:"راند به راند قوی‌تر می‌شود — برنامه داشته باش."},aria:{key:"aria",name:"آریا کین",nick:"صفر",title:"«صفر» — محبوبِ قهرمانی",flag:"\uD83C\uDDFA\uD83C\uDDF8",country:"us",style:"boss",cyborg:!0,tint:16777215,gloves:58879,shorts:659230,aggr:0.72,guard:0.85,dodge:0.78,counter:0.88,stamEff:0.92,combo:0.7,adapt:0.95,taunt:"حرکت‌هایت را قبل از خودت می‌دانم.",bio:"هیچ حرکتی بی‌دلیل ندارد؛ هیچ‌وقت نباخته — اما شرور نیست."}},_$=[{n:0,key:"prologue",type:"cine",title:"پرده ۱ — دعوت‌نامه"},{n:1,key:"qualifier",type:"fight",rival:"rafa",rounds:2,roundLen:40,diff:0.55,xp:150,title:"پرده ۲ — کوالیفایر"},{n:2,key:"wall",type:"fight",rival:"mateo",rounds:3,roundLen:40,diff:0.72,xp:220,title:"پرده ۳ — دیوار"},{n:3,key:"tempo",type:"fight",rival:"nikolai",rounds:3,roundLen:42,diff:0.8,xp:280,title:"پرده ۴ — تپ آهنین"},{n:4,key:"semifinal",type:"fight",rival:"yusuf",rounds:3,roundLen:45,diff:0.9,xp:360,title:"پرده ۵ — نیمه‌نهایی"},{n:5,key:"final",type:"fight",rival:"aria",rounds:3,roundLen:60,diff:1,xp:520,final:!0,title:"پرده ۶ — آخرین راند"}],D6=["ناشناخته","کوالیفایر","چلنجر","فینالیست","فینالیست المپیک","قهرمان"];function L6(J){let $=[0,150,400,750,1250,1900],Z=1;for(let Q=1;Q<$.length;Q++)if(J>=$[Q])Z=Q+1;return Z}function Oq(J){let $=[0,150,400,750,1250,1900];for(let Z=1;Z<$.length;Z++)if(J<$[Z])return{next:$[Z],need:$[Z]-J};return null}var M6=[14164778,1331416,696430,15906565,1118481,15263976,9055202,16739229],B6=[1710618,1331416,696430,14164778,15263976,9055202,15906565,2845247];class C6{constructor(J,$,Z){this.env=J,this.save=$,this.onExit=Z,this.disposed=!1}renderMenu(J){let $=this.save,Z=$.act||0,Q=L6($.xp||0),W=Oq($.xp||0),X=_$.map((H)=>{let Y=($.actClear||[]).indexOf(H.n)>=0,q=H.n<=Z,U=Y?"✅":q?"\uD83E\uDD4A":"\uD83D\uDD12",K=H.rival?r$[H.rival]:null,E=H.type==="cine"?"سینمای داستان":K?K.flag+" "+K.name+" «"+K.nick+"» — "+G7(H.rounds)+" راند":"";return'<div class="b5-act '+(q?"open":"lock")+(H.final?" final":"")+'" data-act="'+H.n+'"><div class="b5-act-ic">'+U+'</div><div class="b5-act-tx"><b>'+R$(H.title)+"</b><span>"+R$(E)+"</span></div>"+(Y?'<div class="b5-act-xp">+'+G7(H.xp||0)+" XP</div>":"")+"</div>"}).join("");J.innerHTML='<div class="b5-story-menu">'+'<div class="b5-story-head"><div class="b5-story-logo">THE LAST ROUND</div><div class="b5-story-sub">دور آخر — کمپین سینمایی بوکسِ World Dominion</div></div>'+'<div class="b5-story-hero"><div class="b5-hero-l"><b>'+R$($.name||"بوکسور")+"</b><span>"+R$(D6[Math.min(5,Q-1)])+" • سطح "+G7(Q)+"</span>"+(W?"<i>تا سطح بعد: "+G7(W.need)+" XP</i>":"<i>به اوج رسیدی</i>")+'</div><div class="b5-hero-r">'+G7($.wins||0)+" برد • "+G7($.losses||0)+" باخت<br>"+G7($.kos||0)+" ناک‌اوت • "+G7($.counters||0)+" کانتر</div>"+'</div><div class="b5-acts">'+X+"</div>"+'<div class="b5-story-tip">هر انتخاب و هر تمرین، مبارزه‌ی بعدی را کمی عوض می‌کند. باخت پایان راه نیست — دوباره بلند شو.</div>'+'<div class="b5-story-btns"><button class="b5-btn ghost" id="b5-story-close">بازگشت</button></div>'+"</div>",J.querySelectorAll(".b5-act.open").forEach((H)=>{H.addEventListener("click",()=>{let Y=+H.getAttribute("data-act");this.startAct(Y,J)})}),J.querySelector("#b5-story-close").addEventListener("click",()=>this.onExit())}async startAct(J,$){let Z=_$[J];if(!Z)return;if(Z.type==="cine")return this.playPrologue($);return this.playFight(Z,$)}playPrologue(J){let $=this.env,Z=$.beginScene(J),Q=this.save;$.arena.setFinalArena(!1),$.arena.lights.hemi.intensity=0.18,$.arena.lights.key.intensity=0.55,$.arena.lights.spotGlow.intensity=0.3,$.arena.crowd.count=0;let W=Z.fighter(-1,{tint:Q.tint||16777215,gloves:Q.gloves||14164778,shorts:Q.shorts||1710618});W.pos.set(-0.6,V7,0),$.cam.to("INTRO",99),$.audio.setMode("menu");let X=0,H=0,Y=!1,q=[[0.5,"سالن بوکس — شب. باران."],[3.2,"هیچ‌کس تو را در فهرست قهرمانان نمی‌دید."],[6.2,"آخرین مسابقه‌ی کوالیفایر: ناک‌داون در ثانیه‌های آخر."],[9,"اما یک اسکاوت المپیک چیز دیگری دید:"],[11.4,"«او هر بار بلند شد.»"],[13.6,"\uD83D\uDCF1 دعوت‌نامه‌ی المپیک World Dominion رسید."]],U=document.createElement("div");U.className="b5-cine-card",J.appendChild(U);let K=document.createElement("button");K.className="b5-skip",K.textContent="رد شدن ⏭",J.appendChild(K);let E=(V)=>{if(X+=V,H+=V,H>0.06)H=0,$.vfx.burst((Math.random()-0.5)*10,6.5,(Math.random()-0.5)*10,3,9418973,0.3,-3.2);W.mixer.timeScale(0.85);for(let[O,_]of q)if(X>=O&&X<O+0.05)U.textContent=_;if(X>=16&&!Y)Y=!0,this.creationForm(J)};Z.onTick=E,K.addEventListener("click",()=>{if(!Y)Y=!0,this.creationForm(J)})}creationForm(J){let $=this.env,Z=this.save;$.endScene();let Q=document.createElement("div");Q.className="b5-create",Q.innerHTML='<div class="b5-create-in">'+"<h3>میدان نبرد توست</h3>"+'<p class="b5-create-p">نام بوکسورت را بنویس و رنگ دستکش و شلوارک را انتخاب کن.</p>'+'<input id="b5-name" maxlength="14" placeholder="نام بوکسور" value="'+R$(Z.name||"")+'"><div class="b5-swatch-row" id="b5-gl">'+M6.map((H,Y)=>'<button data-i="'+Y+'" style="background:#'+H.toString(16).padStart(6,"0")+'" class="'+((Z.gloves||14164778)===H?"on":"")+'"></button>').join("")+'</div><div class="b5-swatch-row" id="b5-sh">'+B6.map((H,Y)=>'<button data-i="'+Y+'" style="background:#'+H.toString(16).padStart(6,"0")+'" class="'+((Z.shorts||1710618)===H?"on":"")+'"></button>').join("")+"</div>"+'<button class="b5-btn gold" id="b5-go">\uD83C\uDFAC شروع مسیر — وارد المپیک شو</button>'+"</div>",J.appendChild(Q);let W=M6.indexOf(Z.gloves)>=0?Z.gloves:14164778,X=B6.indexOf(Z.shorts)>=0?Z.shorts:1710618;Q.querySelectorAll("#b5-gl button").forEach((H)=>H.addEventListener("click",()=>{W=M6[+H.getAttribute("data-i")],Q.querySelectorAll("#b5-gl button").forEach((Y)=>Y.classList.remove("on")),H.classList.add("on"),$.sndK2&&$.sndK2("click")})),Q.querySelectorAll("#b5-sh button").forEach((H)=>H.addEventListener("click",()=>{X=B6[+H.getAttribute("data-i")],Q.querySelectorAll("#b5-sh button").forEach((Y)=>Y.classList.remove("on")),H.classList.add("on"),$.sndK2&&$.sndK2("click")})),Q.querySelector("#b5-go").addEventListener("click",async()=>{let H=(Q.querySelector("#b5-name").value||"").trim().slice(0,14)||"بوکسور";Z.name=H,Z.gloves=W,Z.shorts=X;let Y=await $.rpc("boxing_save",{p_kind:"intro",p_payload:{name:H,gloves:W,shorts:X}});if(Y&&Y.ok&&Y.profile)Object.assign(Z,Y.profile);this.renderMenu($.hubContainer(J))})}playFight(J,$){let Z=this.env,Q=r$[J.rival],W=Z.beginScene($);Z.arena.setFinalArena(!!J.final),Z.arena.crowd.count=Math.min(Z.arena.crowdMax,Z.tier.crowd);let X=this.save,H=X.buff||null,Y=H?{dmg:H==="power",stRegen:H==="stamina",guard:H==="defense",counter:H==="reaction"}:{},q=new o$(Z,{mode:"story",rounds:J.rounds,roundLen:J.roundLen,restLen:6,aiProfile:Q,aiDiff:J.diff+(J.final?(this.save.actClear||[]).indexOf(5)>=0?0:0:0),rng:Math.random,buffs:Y,teach:J.n===1,playerTint:X.tint||16777215,playerGloves:X.gloves,playerShorts:X.shorts,playerName:X.name||"تو",coach:Rq[J.key]||{},onEnd:(U)=>this.fightResult(J,U,$)});W.fight=q,Z.attachInput(q),q.start(),Z.hud.roundCard(Q.flag+" "+Q.name+" «"+Q.nick+"»",Q.title,2.6)}async fightResult(J,$,Z){let Q=this.env;Q.detachInput();let W=$.verdict===1,X=$.stats,H={act:J.n,win:W,verdict:$.verdict,byKo:$.byKo?1:0,durMs:$.durMs,thrown:X.thrown,landed:X.landed,counters:X.counters,dodges:X.dodges,kd:X.kd,maxCombo:X.maxCombo,perfectRounds:W&&X.landed>=8&&X.thrown>=10&&X.kd===0?1:0},Y=await Q.rpc("boxing_save",{p_kind:"act",p_payload:H});if(Y&&Y.ok&&Y.profile)this.save=Object.assign({},this.save,Y.profile);let q=Y&&Y.xpGain||0;Q.endScene();let U=document.createElement("div");if(U.className="b5-result",U.innerHTML='<div class="b5-result-in"><div class="b5-res-big">'+(W?"\uD83C\uDFC6 پیروزی":"\uD83D\uDCA5 باخت")+'</div><div class="b5-res-sub">'+($.byKo?"با ناک‌اوت":"با داوری — کارت "+G7($.decision[0])+" : "+G7($.decision[1]))+"</div>"+'<div class="b5-res-stats">ضربات درست: <b>'+G7(X.landed)+"/"+G7(X.thrown)+"</b> • کانتر: <b>"+G7(X.counters)+"</b> • داوج: <b>"+G7(X.dodges)+"</b> • کمبو: <b>×"+G7(X.maxCombo)+"</b></div>"+(q?'<div class="b5-res-xp">+'+G7(q)+" XP</div>":"")+(W?'<div class="b5-res-quote">'+R$(r$[J.rival].taunt)+"</div>":'<div class="b5-res-quote">مربی: «بلند شو. آخرین راند هنوز نیامده.»</div>')+'<div class="b5-story-btns">'+(W?'<button class="b5-btn gold" id="b5-choice">ادامه ⏭</button>':'<button class="b5-btn gold" id="b5-retry">\uD83D\uDD04 دوباره</button><button class="b5-btn ghost" id="b5-menu">منوی داستان</button>')+"</div></div>",Z.appendChild(U),W)U.querySelector("#b5-choice").addEventListener("click",()=>this.choiceScene(J,Z));else U.querySelector("#b5-retry").addEventListener("click",()=>{U.remove(),this.playFight(J,Z)}),U.querySelector("#b5-menu").addEventListener("click",()=>{U.remove(),this.renderMenu(Q.hubContainer(Z))})}choiceScene(J,$){let Z=this.env;$.querySelectorAll(".b5-result").forEach((H)=>H.remove());let Q=_$[J.n+1],W=Q?r$[Q.rival]:null,X=document.createElement("div");X.className="b5-choice",X.innerHTML='<div class="b5-choice-in">'+'<div class="b5-coach-face">\uD83E\uDDD1‍\uD83C\uDFEB</div>'+"<h3>مربی: «"+(W?W.bio:"فردا کسی تو را نجات نمی‌دهد.")+"»</h3>"+'<p class="b5-choice-p">فردا با '+(W?W.name+" «"+W.nick+"»":"")+" مبارزه داری — روی چه چیزی تمرین کنیم؟</p>"+'<div class="b5-choice-row">'+'<button class="b5-btn" data-c="defense">\uD83D\uDEE1 تمرین دفاع</button>'+'<button class="b5-btn" data-c="power">\uD83D\uDCA5 تمرین قدرت</button>'+'<button class="b5-btn" data-c="stamina">\uD83E\uDEC1 تمرین استقامت</button>'+'<button class="b5-btn ghost" data-c="skip">رد کردن</button>'+"</div></div>",$.appendChild(X),X.querySelectorAll("button[data-c]").forEach((H)=>H.addEventListener("click",async()=>{let Y=H.getAttribute("data-c");if(X.remove(),Y==="skip")return this.trainOffer(J,$,null);this.training(J,$,Y)}))}training(J,$,Z){let Q=this.env;new VQ(Q,Z,$,async(X)=>{let H=await Q.rpc("boxing_save",{p_kind:"train",p_payload:{act:J.n,type:Z,score:Math.round(X)}});if(H&&H.ok&&H.profile)this.save=Object.assign({},this.save,H.profile);Q.endScene();let Y=document.createElement("div");Y.className="b5-result",Y.innerHTML='<div class="b5-result-in"><div class="b5-res-big">'+(X>=60?"آماده‌ای!":"خوب بود")+"</div>"+'<div class="b5-res-sub">امتیاز تمرین: <b>'+G7(Math.round(X))+"</b>"+(X>=60?" — باف مبارزه‌ی بعد فعال شد ⚡":" — باف: نه (به ۶۰ نیاز داری)")+'</div><div class="b5-story-btns"><button class="b5-btn gold" id="b5-next">'+(_$[J.n+1]?"پرده‌ی بعد ⏭":"منو")+"</button></div></div>",$.appendChild(Y),Y.querySelector("#b5-next").addEventListener("click",()=>{if(Y.remove(),_$[J.n+1])this.renderMenu(Q.hubContainer($));else this.renderMenu(Q.hubContainer($))})}).start()}trainOffer(J,$){this.renderMenu(this.env.hubContainer($))}}var Rq={wall:{acc:"«سیلوا را با فینت باز کن — ضربه‌ی مستقیم نمی‌خورد.»",def:"«کانترش را دیدی؟ بعد از گاردش، بدن باز است.»",generic:"«دیوار را با صبر فرو می‌ریزند.»"},tempo:{acc:"«ولکوف نفست را می‌دزدد — عقب برو، صبر کن.»",stam:"«هر ضربه یک شمع است؛ نسوزان‌شان.»",generic:"«بگذار خسته شود، بعد بزن.»"},semifinal:{acc:"«دمیر هر راند قوی‌تر می‌شود — زودتر تمامش کن.»",generic:"«یک راند. فقط همین. آرام.»"},final:{acc:"«کین حرکات تکراری را می‌خواند — الگو را عوض کن.»",def:"«وقتی ساکت می‌ایستد، در فکر چیزی است.»",generic:"«آخرین راند. هر که بلند شود، می‌برد.»"}};class VQ{constructor(J,$,Z,Q){this.env=J,this.type=$,this.container=Z,this.done=Q,this.score=0,this.reps=0,this.total=$==="stamina"?24:8,this.t=0,this.state="wait",this.waitT=1.2,this.cur=null}start(){let J=this.env,$=J.beginScene(this.container);J.arena.setFinalArena(!1),J.arena.crowd.count=0,J.arena.lights.hemi.intensity=0.5,this.me=$.fighter(-1,{tint:16777215,gloves:14164778}),this.me.pos.set(-1.2,V7,0),this.pad=$.fighter(1,{tint:7829367,gloves:3355443}),this.pad.pos.set(1.2,V7,0),this.pad.guarding=!0,J.audio.setMode("gameplay");let Z={reaction:"\uD83C\uDFAF داوج درست",power:"\uD83D\uDCA5 ضربه در لحظه",stamina:"\uD83E\uDEC1 ریتم را نگه دار",defense:"\uD83D\uDEE1 بلاک/کانتر"}[this.type];J.hud.roundCard(Z,this.type==="stamina"?"به ضربِ قلاب گوش کن":"۲۰-۴۰ ثانیه",2);let Q={reaction:"سوایپ چپ/راست = داوج به همان سمت",power:"وقتی حلقه سبز شد بزن (جب/کراس)",stamina:"با ضربه‌های متناوب ریتم را نگه دار",defense:"نگه‌دار=گارد؛ بعد از بلاک سریع بزن"}[this.type];J.hud.hint(Q),$.onTick=(W)=>this.tick(W),this.input=new a$($.canvas,{cmd:(W)=>this.cmd(W),move:()=>{},haptic:J.haptic}),J.input=this.input}cmd(J){if(this.state!=="ask"||!this.cur)return;let $=this.me;if(this.type==="reaction"){if(J.t==="dodge"){let Z=J.dir===this.cur.dir;if(this.rep(Z),Z)this.env.vfx.burst(this.me.pos.x+this.me.side*-0.2,1.5,this.me.pos.z,8,8257438,1.6,1.5)}}else if(this.type==="power"){if(J.t==="punch"){let Z=this.cur.p,Q=1-Math.abs(Z-0.72)*3.2;if(this.rep(Q>0.15),Q>0.15)this.env.vfx.burst(this.pad.pos.x+this.pad.side*-0.3,1.5,this.pad.pos.z,12,16766814,2.4,2),this.env.audio.impact(Q>0.8)}}else if(this.type==="stamina"){if(J.t==="punch"){let Z=p7[J.kind];$.punch(J.kind);let Q=Math.abs(this.t%0.9-0.45)<0.22;if(this.reps++,Q)this.score+=4,this.env.vfx.burst(this.pad.pos.x-0.3,1.5,this.pad.pos.z,6,8257438,1.5,1.5);if(this.reps>=this.total)this.finish()}}else if(this.type==="defense"){if(J.t==="guardOn")this.guarding=!0;if(J.t==="guardOff")this.guarding=!1;if(J.t==="dodge")$.startDodge(J.dir),this.dodged=!0;if(J.t==="punch"&&this.dodged)this.rep(!0),this.dodged=!1,this.score+=6,this.env.vfx.burst(this.pad.pos.x-0.3,1.5,this.pad.pos.z,10,8257438,2,2);if(J.t==="punch"&&this.guarding&&this.cur&&this.cur.phase==="active")this.rep(!0),this.score+=4}}rep(J){if(this.reps++,J)this.score+=this.type==="reaction"?10:8,this.env.sndK2&&this.env.sndK2("coin");else this.env.sndK2&&this.env.sndK2("alert");if(this.state="wait",this.waitT=0.7+Math.random()*0.7,this.cur=null,this.env.hud.hint("✓ "+G7(this.reps)+"/"+G7(this.total)+" — امتیاز "+G7(Math.round(this.score))),this.reps>=this.total)this.finish()}finish(){this.state="over",this.cleanup();let J=this.score,$=this.done;setTimeout(()=>$(J),400)}tick(J){if(this.state==="over")return;if(this.t+=J,this.me.update(J),this.pad.update(J),this.type==="stamina"){if(this.reps<this.total)this.env.hud.knockRing(this.t%0.9/0.9);return}if(this.state==="wait"){if(this.waitT-=J,this.waitT<=0){if(this.type==="reaction")this.cur={dir:Math.random()<0.5?-1:1,phase:"tele",t:0},this.env.hud.hint(this.cur.dir<0?"⬅️ حمله از چپ — داوج چپ!":"➡️ حمله از راست — داوج راست!"),this.state="ask",this.cur.ttl=1.35;else if(this.type==="power")this.cur={p:0,speed:0.85,dir:1},this.env.hud.hint("بزن وقتی حلقه سبز شد!"),this.state="ask";else if(this.type==="defense")this.cur={phase:"tele",t:0,ttl:1.5},this.dodged=!1,this.env.hud.hint("حمله می‌آید — گارد بگیر، بعد کانتر بزن"),this.state="ask"}return}if(this.state==="ask"&&this.cur){let $=this.cur;if($.t=($.t||0)+J,this.type==="reaction"){if($.ttl-=J,!$.fired&&$.t>0.7)$.fired=!0,this.pad.punch($.dir<0?"hookL":"hookR"),this.env.audio.whoosh(!1);if($.ttl<=0)this.rep(!1)}else if(this.type==="power"){if($.p+=$.speed*J*$.dir,$.p>1)$.p=1,$.dir=-1;if($.p<0)$.p=0,$.dir=1;if(this.env.hud.knockRing($.p),$.ttl=($.ttl||0)+J,$.ttl>6)this.rep(!1)}else if(this.type==="defense"){if(!$.fired&&$.t>0.8)$.fired=!0,this.pad.punch("cross"),this.env.audio.whoosh(!1);if($.ttl=($.ttl||0)+J,$.fired&&!$.counted&&$.t>0.95){if($.counted=!0,!this.dodged&&!this.guarding)this.rep(!1);else if(this.guarding)this.rep(!0),this.score+=2}if($.ttl>2.2&&!$.counted)this.rep(!1)}}}cleanup(){this.env.detachInput(),this.env.hud.hint("")}}var C9=(J)=>String(J).replace(/\d/g,($)=>"۰۱۲۳۴۵۶۷۸۹"[$]),GQ=(J)=>String(J==null?"":J).replace(/[&<>"']/g,($)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[$]);function OQ(J){let $=2166136261,Z=String(J||"");for(let Q=0;Q<Z.length;Q++)$^=Z.charCodeAt(Q),$=Math.imul($,16777619)>>>0;return $>>>0}function s0(J,$){let Z=OQ(J+":"+$)|0;return function(){Z|=0,Z=Z+1831565813|0;let Q=Math.imul(Z^Z>>>15,1|Z);return Q=Q+Math.imul(Q^Q>>>7,61|Q)^Q,((Q^Q>>>14)>>>0)/4294967296}}function RQ(){if(document.getElementById("b5-css"))return;let J=document.createElement("style");J.id="b5-css",J.textContent=`
.b5-wrap{position:absolute;inset:0;overflow:hidden;background:#05070d;border-radius:0 0 18px 18px;z-index:3}
.b5-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.b5-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#cfe0f5;z-index:9;background:radial-gradient(ellipse at 50% 35%,rgba(30,45,80,.55),rgba(5,7,13,.96))}
.b5-load .b5-ring{width:64px;height:64px;border-radius:50%;border:4px solid rgba(255,255,255,.12);border-top-color:#ffd75e;animation:b5spin 1s linear infinite}
@keyframes b5spin{to{transform:rotate(360deg)}}
.b5-load b{font-size:14px}
.b5-loadbar{width:min(280px,70%);height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}
.b5-loadbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd75e,#ff4d6d);transition:width .2s}
.b5-hud{position:absolute;inset:0;pointer-events:none;z-index:5;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff}
.b5-top{position:absolute;top:10px;left:0;right:0;display:flex;align-items:center;gap:8px;padding:0 12px}
.b5-name{font-size:11px;font-weight:800;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis}
.b5-name.l{color:#9fe8ff}.b5-name.r{color:#ff9fb0;text-align:left}
.b5-barwrap{flex:1;display:flex;flex-direction:column;gap:3px}
.b5-bar{height:9px;border-radius:5px;background:rgba(255,255,255,.1);position:relative;overflow:hidden}
.b5-bar i{position:absolute;inset:0;transform-origin:left center;border-radius:5px}
.b5-bar{transform-origin:left center}
#b5-php,#b5-ahp{background:linear-gradient(90deg,#22e06a,#7dff9e);transform-origin:left center}
#b5-php.ai,#b5-ahp.ai,#b5-ahp{transform-origin:right center}
#b5-ahp{background:linear-gradient(90deg,#ff4d6d,#ff8ba0)}
#b5-pst{background:#5ec8ff;height:5px}
#b5-ast{background:#8fb8dd;height:5px}
#b5-pmom{background:linear-gradient(90deg,#ffd75e,#fff2b8);height:4px;opacity:.95}
.b5-bar.low{filter:saturate(1.4) brightness(1.2)}
.b5-bar.low:after{content:'';position:absolute;inset:0;background:rgba(255,60,80,.25);animation:b5low .6s ease-in-out infinite alternate}
@keyframes b5low{to{opacity:.4}}
.b5-mid{font-size:10px;font-weight:800;color:#ffd75e;background:rgba(0,0,0,.35);padding:3px 8px;border-radius:10px;border:1px solid rgba(255,215,94,.3);white-space:nowrap}
.b5-clock{position:absolute;top:52px;left:50%;transform:translateX(-50%);font-size:19px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.7);font-variant-numeric:tabular-nums}
.b5-card{position:absolute;top:26%;left:0;right:0;text-align:center;pointer-events:none}
.b5-card-t{font-size:30px;font-weight:900;letter-spacing:1px;text-shadow:0 4px 24px rgba(0,0,0,.8);color:#fff}
.b5-card-s{font-size:12px;color:#ffd75e;font-weight:700;margin-top:4px}
.b5-card.b5-in{animation:b5card .45s cubic-bezier(.2,1.4,.4,1)}
@keyframes b5card{from{transform:scale(1.6);opacity:0}to{transform:scale(1);opacity:1}}
.b5-combo{position:absolute;top:38%;left:0;right:0;text-align:center;font-size:22px;font-weight:900;opacity:0;pointer-events:none;text-shadow:0 3px 16px rgba(0,0,0,.8)}
.b5-combo.b5-pop{animation:b5pop .8s ease-out}
@keyframes b5pop{0%{transform:scale(1.8);opacity:0}18%{transform:scale(1);opacity:1}70%{opacity:1}100%{transform:translateY(-18px);opacity:0}}
.b5-coach{position:absolute;bottom:76px;left:50%;transform:translateX(-50%);max-width:86%;background:rgba(8,14,26,.82);border:1px solid rgba(255,215,94,.35);border-radius:12px;padding:8px 14px;font-size:12px;font-weight:700;color:#ffe9b3;text-align:center;animation:b5card .4s ease-out}
.b5-hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:11px;font-weight:700;color:#9fb6d4;text-shadow:0 2px 8px rgba(0,0,0,.8)}
.b5-knock{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%);width:150px;height:150px;z-index:6}
.b5-knock svg{width:100%;height:100%}
.b5-kring{fill:none;stroke:rgba(255,255,255,.25);stroke-width:5}
.b5-kzone{fill:rgba(125,255,158,.16);stroke:#7dff9e;stroke-width:2.5}
.b5-kmark{fill:#ffd75e;filter:drop-shadow(0 0 6px rgba(255,215,94,.9))}
.b5-klabel{position:absolute;top:100%;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:800;color:#ffe9b3;background:rgba(8,14,26,.7);padding:4px 10px;border-radius:8px}
.b5-fin{position:absolute;bottom:64px;left:50%;transform:translateX(-50%);pointer-events:auto;background:linear-gradient(90deg,#ff9d2e,#ffd75e);border:none;border-radius:14px;padding:12px 26px;font-size:16px;font-weight:900;color:#3a2200;box-shadow:0 0 24px rgba(255,215,94,.6);animation:b5fin .5s ease-in-out infinite alternate;font-family:inherit}
@keyframes b5fin{to{transform:translateX(-50%) scale(1.08)}}
/* منوها */
.b5-overlay{position:absolute;inset:0;z-index:8;overflow-y:auto;background:linear-gradient(180deg,rgba(5,7,13,.82),rgba(5,7,13,.94));padding:14px 12px 24px;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff;direction:rtl}
.b5-story-menu,.b5-create,.b5-result,.b5-choice{max-width:560px;margin:0 auto}
.b5-story-logo{font-size:26px;font-weight:900;letter-spacing:2px;background:linear-gradient(90deg,#ff4d6d,#ffd75e);-webkit-background-clip:text;background-clip:text;color:transparent;text-align:center}
.b5-story-sub{text-align:center;font-size:11px;color:#9fb6d4;margin:2px 0 12px}
.b5-story-head{text-align:center;margin-bottom:10px}
.b5-story-hero{display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 14px;margin-bottom:12px;font-size:12px}
.b5-story-hero b{font-size:15px;color:#9fe8ff}
.b5-story-hero span{display:block;color:#ffd75e;font-size:11px}
.b5-story-hero i{color:#7d92ad;font-size:10px;font-style:normal}
.b5-hero-r{text-align:left;color:#cfe0f5;font-size:11px;line-height:1.7}
.b5-acts{display:flex;flex-direction:column;gap:8px}
.b5-act{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 12px}
.b5-act.open{cursor:pointer}
.b5-act.open:active{transform:scale(.985)}
.b5-act.lock{opacity:.42;filter:grayscale(.6)}
.b5-act.final{border-color:rgba(255,215,94,.45)}
.b5-act-ic{font-size:22px;width:34px;text-align:center}
.b5-act-tx{flex:1;font-size:13px}
.b5-act-tx span{display:block;font-size:10.5px;color:#9fb6d4;margin-top:2px}
.b5-act-xp{font-size:10px;color:#7dff9e;font-weight:800}
.b5-story-tip{font-size:10.5px;color:#7d92ad;text-align:center;margin:12px 0;line-height:1.8}
.b5-story-btns{display:flex;gap:8px;justify-content:center;margin-top:10px}
.b5-btn{background:rgba(126,216,255,.14);color:#cfeaff;border:1px solid rgba(126,216,255,.3);border-radius:12px;padding:10px 18px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}
.b5-btn.gold{background:linear-gradient(90deg,#ff9d2e,#ffd75e);color:#3a2200;border:none;box-shadow:0 4px 18px rgba(255,180,60,.3)}
.b5-btn.ghost{background:rgba(255,255,255,.06);color:#9fb6d4;border-color:rgba(255,255,255,.14)}
.b5-create{background:rgba(10,16,30,.9);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(92%,420px);z-index:9}
.b5-create h3{margin:0 0 6px;font-size:17px;color:#ffd75e}
.b5-create-p{font-size:11.5px;color:#9fb6d4;margin:0 0 12px}
.b5-create input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;font-weight:700;font-family:inherit;margin-bottom:10px}
.b5-swatch-row{display:flex;gap:7px;margin-bottom:10px;flex-wrap:wrap}
.b5-swatch-row button{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.2);cursor:pointer}
.b5-swatch-row button.on{border-color:#ffd75e;box-shadow:0 0 10px rgba(255,215,94,.7)}
.b5-cine-card{position:absolute;bottom:18%;left:0;right:0;text-align:center;font-size:14px;font-weight:800;color:#eaf6ff;text-shadow:0 3px 14px rgba(0,0,0,.9);z-index:6;padding:0 20px;animation:b5card .5s ease-out}
.b5-skip{position:absolute;top:14px;left:14px;z-index:9;background:rgba(0,0,0,.5);color:#cfe0f5;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
.b5-result{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(5,7,13,.7);direction:rtl}
.b5-result-in{background:rgba(10,16,30,.95);border:1px solid rgba(255,215,94,.35);border-radius:20px;padding:22px;max-width:min(92%,440px);text-align:center;animation:b5card .45s cubic-bezier(.2,1.4,.4,1)}
.b5-res-big{font-size:26px;font-weight:900;margin-bottom:4px}
.b5-res-sub{font-size:12px;color:#ffd75e;font-weight:700;margin-bottom:10px}
.b5-res-stats{font-size:11.5px;color:#cfe0f5;line-height:1.9;margin-bottom:8px}
.b5-res-xp{font-size:15px;color:#7dff9e;font-weight:900;margin:6px 0}
.b5-res-quote{font-size:11px;color:#9fb6d4;margin:8px 0 4px;line-height:1.8}
.b5-choice{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(5,7,13,.72);direction:rtl;padding:12px}
.b5-choice-in{background:rgba(10,16,30,.95);border:1px solid rgba(255,215,94,.35);border-radius:20px;padding:20px;max-width:min(94%,480px);text-align:center;animation:b5card .45s cubic-bezier(.2,1.4,.4,1)}
.b5-coach-face{font-size:34px;margin-bottom:6px}
.b5-choice-in h3{font-size:13.5px;color:#ffe9b3;margin:0 0 8px;line-height:1.8}
.b5-choice-p{font-size:11.5px;color:#9fb6d4;margin:0 0 14px}
.b5-choice-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.b5-prof{max-width:560px;margin:0 auto;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff;direction:rtl;font-size:12px}
.b5-prof h3{color:#ffd75e;font-size:15px;margin:6px 0}
.b5-prof .row{display:flex;justify-content:space-between;background:rgba(255,255,255,.05);border-radius:10px;padding:8px 12px;margin-bottom:6px;border:1px solid rgba(255,255,255,.08)}
.b5-prof .row b{color:#9fe8ff}
`,document.head.appendChild(J)}var lJ={state:"idle",wrap:null,canvas:null,overlay:null,arena:null,assets:null,audio:null,vfx:null,cam:null,ts:null,hud:null,tier:null,tierIdx:1,fight:null,story:null,input:null,sceneFighters:[],onTick:null,fpsAcc:0,fpsN:0,fps:60,adaptT:0,adaptDown:0,adaptUp:0,_lastT:0,_tickBound:!1,_resizeObs:null,_visBound:!1,_closeHookPrev:null,sparDone:null,storyCtl:null};function _Q(J){let $=lJ;if($.arena)return Promise.resolve();$.state="loading",$.assets=new N6,$.arena=new z6($.canvas),$.arena.buildLights(),$.audio=new X6,$.ts=new q6,$.tierIdx=v5(),$.tier=c0[$.tierIdx];let Z=$.arena.buildRing($.assets,(W)=>FQ(J,W*0.62)),Q=$.assets.load("boxer","/game/assets/box/boxer.glb",(W)=>FQ(J,0.62+W*0.38));return Promise.all([Z,Q]).then(()=>{$.arena.buildCrowd($.tier.crowd),$.arena.buildDressing(),$.arena.applyTier($.tier),$.vfx=new Y6($.arena.scene,$.tier.particles),$.cam=new H6($.arena.camera),$.hud=new n0,$.state="ready"})}function FQ(J,$){try{J&&J(Math.min(1,$))}catch(Z){}}function NQ(J,$){let Z=lJ;if(RQ(),$&&J)J.innerHTML="";if(!Z.wrap)Z.wrap=document.createElement("div"),Z.wrap.className="b5-wrap",Z.canvas=document.createElement("canvas"),Z.wrap.appendChild(Z.canvas);if(J.appendChild(Z.wrap),Z.overlay=document.createElement("div"),Z.overlay.className="b5-overlay",Z.overlay.style.display="none",Z.wrap.appendChild(Z.overlay),!Z._resizeObs)Z._resizeObs=new ResizeObserver(()=>w6()),Z._resizeObs.observe(Z.wrap);w6()}function w6(){let J=lJ;if(!J.arena||!J.wrap)return;let $=J.wrap.getBoundingClientRect(),Z=Math.max(1,$.width|0),Q=Math.max(1,$.height|0);J.arena.renderer.setSize(Z,Q,!1),J.arena.camera.aspect=Z/Q,J.arena.camera.updateProjectionMatrix()}function zQ(){let J=lJ;if(J._tickBound)return;J._tickBound=!0,window.WD33_API.loop33(function(Z){if(J.state!=="running"&&J.state!=="paused")return;if(J.state==="paused"){J._lastT=Z;return}_q(Z)}),document.addEventListener("visibilitychange",()=>{if(document.hidden)I6();else k6()}),J.canvas.addEventListener("webglcontextlost",(Z)=>{Z.preventDefault(),I6();try{lJ.hud&&lJ.hud.roundCard("⚠️ خطای گرافیک","در حال بازیابی…",2)}catch(Q){}}),J.canvas.addEventListener("webglcontextrestored",()=>{try{w6(),k6()}catch(Z){}}),J._closeHookPrev=window.WD33_ONCLOSE||null,window.WD33_ONCLOSE=function(){try{MQ()}catch(Z){}try{if(J._closeHookPrev)J._closeHookPrev()}catch(Z){}}}function _q(J){let $=lJ,Z=Math.min(0.05,(J-($._lastT||J))/1000||0.016);$._lastDt=Math.round(Z*1000),$._lastT=J;let Q=$.ts.update(Z)*Z,W=performance.now();if(!$._fpsT0)$._fpsT0=W,$._fpsN=0;if($._fpsN++,W-$._fpsT0>=1000)$.fps=Math.round($._fpsN*1000/(W-$._fpsT0)),$._fpsT0=W,$._fpsN=0,Nq();let X=$.fight;if(X)X.update(Z),$.hud.tick(Z,X),$.cam.update(Z,{player:X.player,ai:X.ai,finalRound:X.round>=X.rounds});else{if($.onTick)$.onTick(Z);$.cam.update(Z,{player:$.sceneFighters[0]||{pos:new T(-1,V7,0)},ai:$.sceneFighters[1]||{pos:new T(1,V7,0)},finalRound:!1})}for(let H of $.sceneFighters)H.update(Q);$.vfx.update(Q),$.arena.updateCrowd(Z),$.audio.update(Z);try{$.arena.renderer.render($.arena.scene,$.arena.camera)}catch(H){}}function Nq(){let J=lJ;if(J.adaptT++,J.adaptT<3)return;if(J.adaptT=0,J.fps<27&&J.tierIdx>0&&J.adaptDown<2){if(J.tierIdx--,J.tier=c0[J.tierIdx],J.arena.applyTier(J.tier),J.adaptDown++,J.vfx)J.vfx.cap=J.tier.particles}else if(J.fps>56&&J.adaptUp===0&&J.tierIdx<3){if(J.tierIdx++,J.tier=c0[J.tierIdx],J.arena.applyTier(J.tier),J.adaptUp++,J.vfx)J.vfx.cap=J.tier.particles}}function I6(){let J=lJ;if(J.state==="running"){if(J.state="paused",J.fight)J.fight.paused=!0;J.audio&&J.audio.suspend()}}function k6(){let J=lJ;if(J.state==="paused"){if(J.state="running",J.fight)J.fight.paused=!1;J.audio&&J.audio.resume(),J._lastT=0}}function MQ(){let J=lJ;if(J.state==="closed")return;J.state="closed";try{J.input&&J.input.dispose()}catch($){}try{J.fight&&J.fight.destroy()}catch($){}J.fight=null;try{i0()}catch($){}try{J.hud&&J.hud.unmount()}catch($){}try{J.audio&&J.audio.suspend()}catch($){}try{if(J.wrap&&J.wrap.parentNode)J.wrap.parentNode.removeChild(J.wrap)}catch($){}J.onTick=null,J.storyCtl=null,J.sparDone=null}function i0(){for(let J of lJ.sceneFighters)try{J.dispose()}catch($){}lJ.sceneFighters=[]}function P6(){let J=lJ;return{arena:J.arena,assets:J.assets,audio:J.audio,vfx:J.vfx,cam:J.cam,ts:J.ts,hud:J.hud,tier:J.tier,sndK2:($)=>{try{window.WD33_API.sndK2($)}catch(Z){}},haptic:($)=>{try{navigator.vibrate&&navigator.vibrate($)}catch(Z){}},rpc:async($,Z)=>{try{if(!window.sb)return null;let Q=await window.sb.rpc($,Z);if(Q&&Q.error)return null;return Q?Q.data:null}catch(Q){return null}},beginScene:($)=>zq($),endScene:()=>Mq(),hubContainer:()=>lJ.overlay,attachInput:($)=>BQ($),detachInput:()=>Iq()}}function zq(J){let $=lJ;return $.fight=null,i0(),$.overlay.style.display="none",$.hud.unmount(),$.hud.mount($.wrap),$.cam.to("GAMEPLAY",0),$.audio.setMode("gameplay"),{fighter:(Z,Q)=>{let W=new F$($.arena,$.assets,Object.assign({side:Z},Q));return $.sceneFighters.push(W),W},canvas:$.canvas,set onTick(Z){$.onTick=Z},get onTick(){return $.onTick}}}function Mq(){let J=lJ;i0(),J.onTick=null,J.hud.unmount(),J.overlay.style.display="",J.audio.setMode("menu")}function Bq(J,$){let Z=lJ,Q=window.WD33_API;if(!A6())return!1;if(Z.state==="running"&&Z.fight)return!0;NQ(J,!0),zQ(),Z.sparDone=$,Z.state="loading";let W=document.createElement("div");W.className="b5-load",W.innerHTML='<div class="b5-ring"></div><b>\uD83C\uDFDF ورود به حلقه…</b><div class="b5-loadbar"><i id="b5-lb"></i></div>',J.appendChild(W);let X=()=>J.querySelector("#b5-lb");return(async()=>{try{await _Q((H)=>{let Y=X();if(Y)Y.style.width=Math.round(H*100)+"%"})}catch(H){console.log("b5load",H);try{W.remove()}catch(Y){}try{$&&$(0)}catch(Y){}return}try{W.remove()}catch(H){}try{let H=Q.MATCH&&Q.MATCH.seed||"box5";Z.hud.mount(Z.wrap),Z.state="running",Z._lastT=0,Z.fight=new o$(P6(),{mode:"spar",seed:H,seedRng:s0(H,"plan"),rounds:3,roundLen:30,restLen:4,aiProfile:Dq(H),aiDiff:1,rng:s0(H,"jitter"),playerTint:16777215,playerGloves:14164778,playerShorts:1710618,playerName:"تو",spar:!0,onEvent:function(){try{Q.TELE.ev.apply(Q.TELE,arguments)}catch(Y){}},onEnd:(Y)=>Lq(Y)}),BQ(Z.fight);try{Q.TELE.ev("v5",0,3)}catch(Y){}Z.fight.start()}catch(H){console.log("b5spar-init",H),Z.state="ready";try{$&&$(0)}catch(Y){}}})(),!0}function Dq(J){let $=s0(J,"prof");return{name:"حریف سپار",tint:10135480,gloves:11538986,shorts:1120295,aggr:0.55+$()*0.2,guard:0.5+$()*0.2,dodge:0.35+$()*0.2,counter:0.4+$()*0.2,stamEff:0.6,combo:0.35+$()*0.2,adapt:0.4}}function Lq(J){let $=lJ,Z=J.scoreLocal;try{$.input&&$.input.dispose()}catch(W){}$.input=null,$.fight=null,i0(),$.hud.unmount(),$.audio.setMode("menu"),$.state="ready";let Q=$.sparDone;if($.sparDone=null,$.wrap&&$.wrap.parentNode)$.wrap.parentNode.removeChild($.wrap);try{Q&&Q(Z)}catch(W){try{Q&&Q(0)}catch(X){}}}async function Cq(J){let $=lJ;if(!A6())return!1;NQ(J,!0),zQ(),$.state="loading";let Z=document.createElement("div");Z.className="b5-load",Z.innerHTML='<div class="b5-ring"></div><b>\uD83C\uDFDF استادیوم المپیک…</b><div class="b5-loadbar"><i id="b5-lb"></i></div>',J.appendChild(Z);let Q=()=>J.querySelector("#b5-lb");try{await _Q((H)=>{let Y=Q();if(Y)Y.style.width=Math.round(H*100)+"%"})}catch(H){return console.log("b5load",H),Z.remove(),!1}Z.remove(),$.state="running",$._lastT=0,$.cam.to("INTRO",99),$.audio.setMode("menu");let W=await P6().rpc("boxing_load",{}),X=W&&W.ok&&W.profile?W.profile:{act:0,actClear:[],xp:0,wins:0,losses:0,kos:0,counters:0,dodges:0,gloves:14164778,shorts:1710618,name:""};return $.hud.mount($.wrap),$.overlay.style.display="",$.storyCtl=new C6(P6(),X,()=>{}),$.storyCtl.renderMenu($.overlay),!0}async function wq(J){RQ();let $=document.createElement("div");$.className="b5-prof",$.innerHTML='<h3>\uD83E\uDD4A پروفایل بوکس</h3><div id="b5-prof-in">⏳ …</div>',J.appendChild($);let Z=$.querySelector("#b5-prof-in"),Q=await(async()=>{try{if(!window.sb)return null;let H=await window.sb.rpc("boxing_load",{});return H&&!H.error?H.data:null}catch(H){return null}})();if(!Q||!Q.ok||!Q.profile)return Z.innerHTML='<div class="row"><span>کمپین «دور آخر» را شروع نکرده‌ای</span><b>—</b></div><div style="font-size:11px;color:#7d92ad">از کارت بوکس، «داستان: دور آخر» را باز کن.</div>',$;let W=Q.profile,X=L6(W.xp||0);return Z.innerHTML='<div class="row"><span>بوکسور</span><b>'+GQ(W.name||"—")+"</b></div>"+'<div class="row"><span>رتبه</span><b>'+GQ(D6[Math.min(5,X-1)])+" • سطح "+C9(X)+"</b></div>"+'<div class="row"><span>کارنامه</span><b>'+C9(W.wins||0)+" برد / "+C9(W.losses||0)+" باخت</b></div>"+'<div class="row"><span>ناک‌اوت / کانتر / داوج</span><b>'+C9(W.kos||0)+" / "+C9(W.counters||0)+" / "+C9(W.dodges||0)+'</b></div><div class="row"><span>XP</span><b>'+C9(W.xp||0)+"</b></div>"+'<div class="row"><span>پرده‌ی جاری «دور آخر»</span><b>'+C9(W.act||0)+" از ۵</b></div>",$}function BQ(J){let $=lJ;if($.input)try{$.input.dispose()}catch(Z){}$.input=new a$($.canvas,{cmd:(Z)=>{if($.fight)$.fight.command(Z)},move:(Z)=>{if($.fight)$.fight.movePlayer(Z)},knockTap:()=>{if($.fight&&$.fight.phase==="KD")$.fight.knockTap()},anyInput:()=>{if($.fight&&$.fight.phase==="FIGHT"&&$.cam.state!=="GAMEPLAY")$.cam.gameplay();$.audio&&$.audio.resume()},haptic:(Z)=>{try{navigator.vibrate&&navigator.vibrate(Z)}catch(Q){}}});try{$.hud.refs.fin.addEventListener("click",(Z)=>{Z.stopPropagation(),$.fight&&$.fight.command({t:"finisher"})})}catch(Z){}}function Iq(){let J=lJ;if(J.input)try{J.input.dispose()}catch($){}J.input=null}function A6(){try{let J=document.createElement("canvas");return!!(window.WebGLRenderingContext&&(J.getContext("webgl")||J.getContext("experimental-webgl")))}catch(J){return!1}}window.WD_BOX5={openSpar:Bq,openStory:Cq,openProfile:wq,supported:A6,pause:I6,resume:k6,dispose:MQ,version:5,_debug:()=>({state:lJ.state,phase:lJ.fight?lJ.fight.phase:null,round:lJ.fight?lJ.fight.round:null,clock:lJ.fight?Math.round(lJ.fight.clock*10)/10:null,time:lJ.fight?Math.round(lJ.fight.time*10)/10:null,cam:lJ.cam?lJ.cam.state:null,fps:lJ.fps,tier:lJ.tier?lJ.tier.name:null,lastDt:lJ._lastDt,now:Math.round(performance.now())})};})();
