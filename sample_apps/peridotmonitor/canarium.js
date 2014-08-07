// ------------------------------------------------------------------- //
//  PERIDOT Chrome Package Apps Driver - 'Canarium.js'                 //
// ------------------------------------------------------------------- //
//
//  ver 0.9.1
//		2014/06/04	s.osafune@gmail.com
//
//  ver 0.9.2
//		2014/08/04	s.osafune@gmail.com
//
// ******************************************************************* //
//     Copyright (C) 2014, J-7SYSTEM Works.  All rights Reserved.      //
//                                                                     //
// * This module is a free sourcecode and there is NO WARRANTY.        //
// * No restriction on use. You can use, modify and redistribute it    //
//   for personal, non-profit or commercial products UNDER YOUR        //
//   RESPONSIBILITY.                                                   //
// * Redistributions of source code must retain the above copyright    //
//   notice.                                                           //
//                                                                     //
//         PERIDOT Project - https://github.com/osafune/peridot        //
//                                                                     //
// ******************************************************************* //

// API
//	.open(port portname, function callback(bool result));
//	.close(function callback(bool result));
//	.config(obj boardInfo, arraybuffer rbfdata[], function callback(bool result));
//	.reset(function callback(bool result));
//	.getinfo(function callback(bool result));
//	.avm.read(uint address, int bytenum, function callback(bool result, arraybuffer readdata[]));
//	.avm.write(uint address, arraybuffer writedata[], function callback(bool result));
//	.avm.iord(uint address, int offset, function callback(bool result, uint readdata));
//	.avm.iowr(uint address, int offset, uint writedata, function callback(bool result));
//	.avm.option(object option, function callback(bool result));

var Canarium = function() {
	var self = this;

	//////////////////////////////////////////////////
	//  ���J�I�u�W�F�N�g 
	//////////////////////////////////////////////////

	// �ڑ����Ă���{�[�h�̏�� 
	// Information of the board that this object is connected
	self.boardInfo = null;
//	{
//		id : strings,			// 'J72A' (J-7SYSTEM Works / PERIDOT board)
//		serialcode : strings	// 'xxxxxx-yyyyyy-zzzzzz'
//	};

	// �f�t�H���g�̃r�b�g���[�g 
	// The default bitrate
	self.serialBitrate = 115200;


	// API 
	self.open	= function(portname, callback){ devopen(portname, callback); };
	self.close	= function(callback){ devclose(callback); };
	self.config	= function(boardInfo, rbfarraybuf, callback){ devconfig(boardInfo, rbfarraybuf, callback); };
	self.reset	= function(callback){ devreset(callback); };
	self.getinfo= function(callback){ devgetinfo(callback); };

	self.avm = {
		read	: function(address, readbytenum, callback){ avmread(address, readbytenum, callback); },
		write	: function(address, writedata, callback){ avmwrite(address, writedata, callback); },
		iord	: function(address, offset, callback){ avmiord(address, offset, callback); },
		iowr	: function(address, offset, writedata, callback){ avmiowr(address, offset, writedata, callback); },
		option	: function(option, callback){ avmoption(option, callback); }
	};

	self.i2c = {
		start	: function(callback){ i2cstart(callback); },
		stop	: function(callback){ i2cstop(callback); },
		read	: function(ack, callback){ i2cread(ack, callback); },
		write	: function(writebyte, callback){ i2cwrite(writebyte, callback); }
	};



	//////////////////////////////////////////////////
	//  �����ϐ�����уp�����[�^ 
	//////////////////////////////////////////////////

	// ���̃I�u�W�F�N�g���g�p����ʐM�I�u�W�F�N�g 
	// The communication object which this object uses
	var comm = null;

	// ���̃I�u�W�F�N�g���{�[�h�ɐڑ����Ă����true 
	// True this object if connected to the board
	var onConnect = false;

	// ���̃I�u�W�F�N�g���ڑ����Ă���{�[�h�����s�\��Ԃł����true 
	// True board of this object if it is ready to run
	var confrun = false;

	// AvalonMM�g�����U�N�V�����̑��������I�v�V���� 
	// Send Immediate option of the Avalon-MM Transaction
	var avmSendImmediate = false;


	// I2C�o�X���^�C���A�E�g�����Ɣ��肷��܂ł̎��s�� 
	// Number of attempts to determine I2C has timed out
	var i2cTimeoutCycle = 100;

	// FPGA�R���t�B�O���[�V�������^�C���A�E�g�����Ɣ��肷��܂ł̎��s�� 
	// Number of attempts to determine FPGA-Configuration has timed out
	var configTimeoutCycle = 100;

	// AvalonMM�g�����U�N�V�����p�P�b�g�̍ő咷 
	// The maximum length of the Avalon-MM Transaction packets
	var avmTransactionMaxLength = 32768;



	//////////////////////////////////////////////////
	//  �������\�b�h (�V���A�����o�͌Q)
	//////////////////////////////////////////////////

	var serialReadbufferMaxLength = 4096;
	var serialReadbufferTimeoutms = 100;

	var serialio = function() {
		var self = this;
		var connectionId = null;


		// �V���A����M���X�i 

		var readbuff = new ringbuffer(serialReadbufferMaxLength);

		var onReceiveCallback = function(info) {
			if (info.connectionId == connectionId) {
				var data_arr = new Uint8Array(info.data);

				for(var i=0 ; i<data_arr.byteLength ; i++) {
					if ( !readbuff.add(data_arr[i]) ) break;
				}
			}
		};


		// �V���A���|�[�g�ڑ� 

		self.open = function(portname, options, callback) {
			if (connectionId != null) {
				console.log("serial : [!] Serial port is already opened.");
				callback(false);
				return;
			}

			chrome.serial.connect(portname, options, function (openInfo) {
				if (openInfo.connectionId > 0) {
					connectionId = openInfo.connectionId;
					console.log("serial : Open connectionId = " + connectionId + " (" + portname + ", " + options.bitrate + "bps)");

					chrome.serial.onReceive.addListener(onReceiveCallback);
					console.log("serial : Receive listener is started.");

					callback(true);

				} else {
					console.log("serial : [!] " + portname + " is not connectable.");

					callback(false);
				}
			});
		};


		// �V���A���|�[�g�ؒf 

		self.close = function(callback) {
			if (connectionId == null) {
				console.log("serial : [!] Serial port is not open.");
				callback(false);
				return;
			}

		    chrome.serial.disconnect(connectionId, function () {
				console.log("serial : Close connectionId = " + connectionId);
				connectionId = null;

				callback(true);
		    });
		};


		// �V���A���f�[�^���M 

		self.write = function(wirtearraybuf, callback) {
			if (connectionId == null) {
				console.log("serial : [!] Serial write port is not open.");
				callback(false);
				return;
			}

		    chrome.serial.send(connectionId, wirtearraybuf, function (writeInfo){
				var leftbytes = wirtearraybuf.byteLength - writeInfo.bytesSent;
				var bool_witten = true;

				if (leftbytes == 0) {
//					console.log("serial : write " + writeInfo.bytesSent + "bytes success.");
				} else {
					bool_witten = false;
					console.log("serial : [!] write " + writeInfo.bytesSent + "bytes written, " + leftbytes + "bytes left.");
				}

				chrome.serial.flush(connectionId, function(){
					callback(bool_witten, writeInfo.bytesSent);
				});
			});
		};


		// �V���A���f�[�^��M 

		self.read = function(bytenum, callback) {
			if (connectionId == null) {
				console.log("serial : [!] Serial read port is not open.");
				callback(false);
				return;
			}

			var readarraybuf = new ArrayBuffer(bytenum);
			var readarraybuf_arr = new Uint8Array(readarraybuf);
			var readarraybuf_num = 0;

			var blobread = function(leftbytes, callback) {
				var datacount = readbuff.getcount();

				if (datacount == 0) {			// �o�b�t�@����̏ꍇ�͎���҂� 
					setTimeout(function(){
						if (readbuff.getcount() == 0) {
							console.log("serial : [!] read is timeout.");
							callback(false, readarraybuf_num, readarraybuf);	// �^�C���A�E�g 
						} else {
							blobread(leftbytes, callback);						// ���g���C 
						}
					}, serialReadbufferTimeoutms);

				} else {
					if (datacount >= leftbytes) datacount = leftbytes;

					for(var i=0 ; i<datacount ; i++) readarraybuf_arr[readarraybuf_num++] = readbuff.get();
					leftbytes -= datacount;

					if (leftbytes > 0) {
						blobread(leftbytes, callback);
					} else {
//						console.log("serial : read " + readarraybuf_num + "bytes");
						callback(true, readarraybuf_num, readarraybuf);
					}

				}
			};

			blobread(bytenum, callback);
		};
	};


	// �����O�o�b�t�@ 
	// bool rb.add(byte indata)
	// int rb.get()
	// int rb.getcount()

	var ringbuffer = function(bufferlength) {
		var self = this;

		self.overrun = false;		// �o�b�t�@�I�[�o�[�����G���[ 

		var buffer = new ArrayBuffer(bufferlength);
		var writeindex = 0;
		var readindex = 0;


		// �f�[�^�������� 

		self.add = function(indata) {
			var buff_arr = new Uint8Array(buffer);

			// �o�b�t�@�I�[�o�[�����̃`�F�b�N 
			var nextindex = writeindex + 1;
			if (nextindex >= buff_arr.byteLength) nextindex = 0;

			if (nextindex == readindex) {
				self.overrun = true;
				cosnole.log("serial : [!] Readbuffer overrun.");
				return false;
			}

			// �o�b�t�@�֏������� 
			buff_arr[writeindex] = indata;
			writeindex = nextindex;
//			console.log("serial : inqueue 0x" + ("0"+indata.toString(16)).slice(-2));

			return true;
		};


		// �f�[�^�ǂݏo�� 

		self.get = function() {
			if (readindex == writeindex) return null;

			var buff_arr = new Uint8Array(buffer);
			var data = buff_arr[readindex];

			readindex++;
			if (readindex >= buff_arr.byteLength) readindex = 0;

			return data;
		};


		// �L���[����Ă���f�[�^���̎擾 

		self.getcount = function() {
			var buff_arr = new Uint8Array(buffer);
			var len = writeindex - readindex;

			if (len < 0) len += buff_arr.byteLength;

			return len;
		};
	};



	//////////////////////////////////////////////////
	//  ��{���\�b�h 
	//////////////////////////////////////////////////

	// PERIDOT�f�o�C�X�|�[�g�̃I�[�v�� 
	//	devopen(port portname, function callback(bool result));

	var devopen = function(portname, callback) {
		if (onConnect) {
			callback(false);		// ���ɐڑ����m�����Ă���ꍇ 
			return;
		}

		self.boardInfo = null;
		avmSendImmediate = false;

		comm = new serialio();		// �ʐM�I�u�W�F�N�g���C���X�^���X 

		// �V���A���|�[�g�ڑ� 
		var connect = function() {
			var options = {bitrate:self.serialBitrate};

			comm.open(portname, options, function(result) {
				if (result) {
					onConnect = true;
					confrun = false;
					psconfcheck();
				} else {
					open_exit(false);
				}
			});
		};

		// PERIDOT�R���t�B�O���[�^�����̃e�X�g 
		var psconfcheck = function() {
			commandtrans(0x39, function(result, respbyte) {
				if (result) {
					console.log("board : Confirm acknowledge.");
					getboardheader();				// �R�}���h�ɉ����������� 
				} else {
					console.log("board : [!] No response.");
					open_exit(false);				// �R�}���h�ɉ������Ȃ����� 
				}
			});
		};

		// EEPROM�w�b�_�̓ǂݎ�� 
		var getboardheader = function() {
			eepromread(0x00, 4, function(result, readdata) {
				if (result) {
					var readdata_arr = new Uint8Array(readdata);
					var header = (readdata_arr[0] << 16) | (readdata_arr[1] << 8) | (readdata_arr[2] << 0);

					if (header == 0x4a3757) {		// J7W�̃w�b�_������ 
						self.boardInfo = {version : readdata_arr[3]};
						console.log("board : EEPROM header version = " + self.boardInfo.version);
					} else {						// J7W�̃w�b�_���Ȃ� 
						self.boardInfo = {version : 0};
						console.log("board : [!] Unknown EEPROM header.");
					}
				} else {							// EEPROM���Ȃ� 
					self.boardInfo = {version : 0};
					console.log("board : [!] EEPROM not found.");
				}

				open_exit(true);
			});
		};

		// �I������ 
		var open_exit = function(result) {
			if (result) {
				callback(true);
			} else {
				if (onConnect) {
					self.close(function() {
						callback(false);
					});
				} else {
					callback(false);
				}
			}
		};

		connect();
	};


	// PERIDOT�f�o�C�X�|�[�g�̃N���[�Y 
	//	devclose(function callback(bool result));

	var devclose = function(callback) {
		if (!onConnect) {
			callback(false);		// �ڑ����m�����Ă��Ȃ��ꍇ 
			return;
		}

		comm.close(function(result) {
			onConnect = false;
			confrun = false;
			self.boardInfo = null;
			comm = null;

			callback(true);
		});
	};


	// �{�[�h��FPGA�R���t�B�O���[�V���� 
	//	devconfig(obj boardInfo, arraybuffer rbfdata[],
	//						function callback(bool result));

	var configBarrier = false;
	var devconfig = function(boardInfo, rbfarraybuf, callback) {

		///// �R���t�B�O�V�[�P���X�����܂ōĎ��s��j�~���� /////

		if (!onConnect || !rbfarraybuf || configBarrier || mresetBarrier) {
			callback(false);
			return;
		}

		configBarrier = true;


		///// FPGA�R���t�B�O���[�V�����V�[�P���T /////

		var sendretry = 0;		// �^�C���A�E�g�J�E���^ 

		// FPGA�̃R���t�B�O���[�V�����J�n���� 
		var setup = function() {
			commandtrans(0x39, function (result, respbyte) {
				if (result) {
					if ((respbyte & 0x01)== 0x00) {		// PS���[�h 
						console.log("config : configuration is started.");
						confrun = false;
						sendretry = 0;
						sendinit();
					} else {
						console.log("config : [!] Setting is not in the PS mode.");
						errorabort();
					}
				} else {
					errorabort();
				}
			});
		};

		// �R���t�B�O���[�V�����J�n���N�G�X�g���s 
		var sendinit = function() {
			commandtrans(0x30, function (result, respbyte) {	// �R���t�B�O���[�h�AnCONFIG�A�T�[�g 
				if (result || sendretry < configTimeoutCycle) {
					if ((respbyte & 0x06)== 0x00) {		// nSTATUS = L, CONF_DONE = L
						sendretry = 0;
						sendready();
					} else {
						sendretry++;
						sendinit();
					}
				} else {
					console.log("config : [!] nCONFIG request is timeout.");
					errorabort();
				}
			});
		};

		// FPGA����̉�����҂� 
		var sendready = function() {
			commandtrans(0x31, function (result, respbyte) {	// �R���t�B�O���[�h�AnCONFIG�l�Q�[�g 
				if (result || sendretry < configTimeoutCycle) {
					if ((respbyte & 0x06)== 0x02) {		// nSTATUS = H, CONF_DONE = L
						sendretry = 0;
						sendrbf();
					} else {
						sendretry++;
						sendready();
					}
				} else {
					console.log("config : [!] nSTATUS response is timeout.");
					errorabort();
				}
			});
		};

		// �R���t�B�O�t�@�C�����M 
		var sendrbf = function() {
			comm.write(rbfescapebuf, function (result, bytewritten) {
				if (result) {
					console.log("config : " + bytewritten + "bytes of configuration data was sent.");
					checkstatus();
				} else {
					errorabort();
				}
			});
		};

		// �R���t�B�O�����`�F�b�N 
		var checkstatus = function() {
			commandtrans(0x31, function (result, respbyte) {	// �R���t�B�O���[�h�A�X�e�[�^�X�`�F�b�N 
				if (result) {
					if ((respbyte & 0x06)== 0x06) {		// nSTATUS = H, CONF_DONE = H
						switchuser();
					} else {
						errordone();
					}
				} else {
					errorabort();
				}
			});
		};

		// �R���t�B�O���� 
		var switchuser = function() {
			commandtrans(0x39, function (result, respbyte) {	// ���[�U�[���[�h 
				if (result) {
					console.log("config : configuration completion.");
					confrun = true;
					config_exit(true);
				} else {
					errorabort();
				}
			});
		};

		// �ʐM�G���[ 
		var errorabort = function() {
			console.log("config : [!] communication error abort.");
			config_exit(false);
		};

		// �R���t�B�O�G���[ 
		var errordone = function() {
			console.log("config : [!] configuration error.");
			config_exit(false);
		};

		// �I������ 
		var config_exit = function(result) {
			configBarrier = false;
			callback(result);
		};


		///// �o�C�g�G�X�P�[�v���� /////

		var rbfescape = new Array();
		var rbfarraybuf_arr = new Uint8Array(rbfarraybuf);
		var escape_num = 0;

		for(var i=0 ; i<rbfarraybuf.byteLength ; i++) {
			if (rbfarraybuf_arr[i] == 0x3a || rbfarraybuf_arr[i] == 0x3d) {
				rbfescape.push(0x3d);
				rbfescape.push(rbfarraybuf_arr[i] ^ 0x20);
				escape_num++;
			} else {
				rbfescape.push(rbfarraybuf_arr[i]);
			}
		}

		var rbfescapebuf = new ArrayBuffer(rbfescape.length);
		var rbfescapebuf_arr = new Uint8Array(rbfescapebuf);
		var checksum = 0;

		for(var i=0 ; i<rbfescape.length ; i++) {
			rbfescapebuf_arr[i] = rbfescape[i];
			checksum = (checksum + rbfescapebuf_arr[i]) & 0xff;
		}

		console.log("config : " + escape_num + " places were escaped. config data size = " + rbfescapebuf.byteLength + "bytes");


		///// �R���t�B�O���[�V�����̎��s /////

		if (boardInfo) {
			devgetinfo( function(result) {		// boardInfo�Ń^�[�Q�b�g�𐧌�����ꍇ 
				if (result) {
					var conf = true;
					if ('id' in boardInfo && boardInfo.id != self.boardInfo.id) {
						conf = false;
						console.log("config : [!] Board ID is not in agreement.");
					}
					if ('serialcode' in boardInfo && boardInfo.serialcode != self.boardInfo.serialcode) {
						conf = false;
						console.log("config : [!] Board serial-code is not in agreement.");
					}

					if (conf) {
						setup();
					} else {
						config_exit(false);
					}
				} else {
					config_exit(false);
				}
			});
		} else {
			setup();
		}
	};


	// �{�[�h�̃}�j���A�����Z�b�g 
	//	devreset(function callback(bool result));

	var mresetBarrier = false;
	var devreset = function(callback) {
		if (!onConnect || mresetBarrier) {
			callback(false);
			return;
		}

		mresetBarrier = true;

		var resetassert = function() {
			commandtrans(0x31, function (result, respbyte) {
				if (result) {
					setTimeout(function(){ resetnegate(); }, 100);	// 100ms��Ƀ��Z�b�g���������� 
				} else {
					mreset_exit(false);
				}
			});
		};

		var resetnegate = function() {
			commandtrans(0x39, function (result, respbyte) {
				if (result) {
					console.log("mreset : The issue complete.");
					avmSendImmediate = false;
					reset_exit(true);
				} else {
					reset_exit(false);
				}
			});
		};

		var reset_exit = function(result) {
			mresetBarrier = false;
			callback(result);
		};

		resetassert();
	};


	// �{�[�h���̎擾 
	//	devgetinfo(function callback(bool result));

	var getinfoBarrier = false;
	var devgetinfo = function(callback) {
		if (!onConnect || getinfoBarrier) {
			callback(false);
			return;
		}

		getinfoBarrier = true;

		// ver.1�w�b�_ 
		var getboadinfo_v1 = function() {
			eepromread(0x04, 8, function(result, readdata) {
				if (result) {
					var readdata_arr = new Uint8Array(readdata);
					var mid = (((readdata_arr[0] << 8) | (readdata_arr[1] << 0))>>> 0);
					var pid = (((readdata_arr[2] << 8) | (readdata_arr[3] << 0))>>> 0);
					var sid = (((readdata_arr[4] << 24) | (readdata_arr[5] << 16) | (readdata_arr[6] << 8)|(readdata_arr[7] << 0))>>> 0);

					if (mid == 0x0072) {
						var s = ("0000" + pid.toString(16)).slice(-4) + ("00000000" + sid.toString(16)).slice(-8);
						self.boardInfo.id = "J72A";
						self.boardInfo.serialcode = s.substr(0,6) + "-" + s.substr(6,6) + "-000000";
					}
				}

				getinfo_exit(result);
			});
		};

		// ver.2�w�b�_ 
		var getboadinfo_v2 = function() {
			eepromread(0x04, 22, function(result, readdata) {
				if (result) {
					var readdata_arr = new Uint8Array(readdata);
					var bid = "";
					var sid = "";

					for(var i=0 ; i<4 ; i++) bid += String.fromCharCode(readdata_arr[i]);

					for(var i=0 ; i<18 ; i++) {
						sid += String.fromCharCode(readdata_arr[4+i]);
						if (i == 5 || i == 11) sid += "-";
					}

					self.boardInfo.id = bid;
					self.boardInfo.serialcode = sid;
				}

				getinfo_exit(result);
			});
		};

		//  EEPROM�������A�܂��͓��e���s�� 
		var getboadinfo_def = function() {
			self.boardInfo.id = "";
			self.boardInfo.serialcode = "";

			getinfo_exit(true);
		};

		// �I������ 
		var getinfo_exit = function(result) {
			if (result) {
				console.log("board : version = " + self.boardInfo.version + "\n" +
							"        ID = " + self.boardInfo.id + "\n" +
							"        serial code = " + self.boardInfo.serialcode
				);
			}

			getinfoBarrier = false;
			callback(result);
		};


		switch(self.boardInfo.version) {
		case 1 :					// �w�b�_ver.1
			getboadinfo_v1();
			break;

		case 2 : 					// �w�b�_ver.2
			getboadinfo_v2();
			break;

		default :				// EEPROM�������A�܂��͓��e���s�� 
			getboadinfo_def();
			break;
		}
	};



	//////////////////////////////////////////////////
	//  Avalon-MM�g�����U�N�V�������\�b�h 
	//////////////////////////////////////////////////

	// AvalonMM�I�v�V�����ݒ� 
	//	avmoption(object option,
	//					function callback(bool result);

	var avmoption = function(option, callback) {
//		if (!onConnect || !confrun || mresetBarrier) {
		if (!onConnect || mresetBarrier) {
			callback(false);
			return;
		}

		if (option.fastAcknowledge != null) {
			if (option.fastAcknowledge) {
				avmSendImmediate = true;
			} else {
				avmSendImmediate = false;
			}

			var com = 0x39;
			if (avmSendImmediate) com |= 0x02;	// �����������[�h�r�b�g 

			commandtrans(com, function (result, respbyte) {
				if (result) {
					console.log("avm : Set option send immediate is " + avmSendImmediate);
					callback(true);
				} else {
					callback(false);
				}
			});
		}
	};


	// AvalonMM�y���t�F�������[�h(IORD)
	//	avmiord(uint address, int offset,
	//					function callback(bool result, uint readdata));

	var avmiord = function(address, offset, callback) {
		if (!onConnect || !confrun || mresetBarrier) {
			callback(false, null);
			return;
		}

		var regaddr = ((address & 0xfffffffc)>>> 0) + (offset << 2);
		var writepacket = new avmPacket(0x10, 4, regaddr, 0);	// �V���O�����[�h�p�P�b�g�𐶐� 

		avmtrans(writepacket, function (result, readpacket) {
			var res = false;
			var readdata = null;

			if (result) {
				if (readpacket.byteLength == 4) {
					var readpacket_arr = new Uint8Array(readpacket);
					readdata = (
						(readpacket_arr[3] << 24) |
						(readpacket_arr[2] << 16) |
						(readpacket_arr[1] <<  8) |
						(readpacket_arr[0] <<  0) )>>> 0;		// �����Ȃ�32bit���� 
					res = true;

					console.log("avm : iord(0x" + ("00000000"+address.toString(16)).slice(-8) + ", " + offset + ") = 0x" + ("00000000"+readdata.toString(16)).slice(-8));
				}
			}

			callback(res, readdata);
		});
	};


	// AvalonMM�y���t�F�������C�g(IOWR)
	//	avmiowr(uint address, int offset, uint writedata,
	//					function callback(bool result));

	var avmiowr = function(address, offset, writedata, callback) {
		if (!onConnect || !confrun || mresetBarrier) {
			callback(false);
			return;
		}

		var regaddr = ((address & 0xfffffffc)>>> 0) + (offset << 2);
		var writepacket = new avmPacket(0x00, 4, regaddr, 4);	// �V���O�����C�g�p�P�b�g�𐶐� 
		var writepacket_arr = new Uint8Array(writepacket);

		writepacket_arr[8]  = (writedata >>>  0) & 0xff;		// �����Ȃ�32bit���� 
		writepacket_arr[9]  = (writedata >>>  8) & 0xff;
		writepacket_arr[10] = (writedata >>> 16) & 0xff;
		writepacket_arr[11] = (writedata >>> 24) & 0xff;

		avmtrans(writepacket, function (result, readpacket) {
			var res = false;

			if (result) {
				var readpacket_arr = new Uint8Array(readpacket);
				var size = (readpacket_arr[2] << 8) | (readpacket_arr[3] << 0);

				if (readpacket_arr[0] == 0x80 && size == 4) {
					res = true;

					console.log("avm : iowr(0x" + ("00000000"+address.toString(16)).slice(-8) + ", " + offset + ", 0x" + ("00000000"+writedata.toString(16)).slice(-8) + ")");
				}
			}

			callback(res);
		});
	};


	// AvalonMM���������[�h(IORD_DIRECT)
	//	avmread(uint address, int bytenum,
	//					function callback(bool result, arraybuffer readdata[]));

	var avmread = function(address, readbytenum, callback) {
		if (!onConnect || !confrun || mresetBarrier) {
			callback(false, null);
			return;
		}

		var readdata = new ArrayBuffer(readbytenum);
		var readdata_arr = new Uint8Array(readdata);
		var byteoffset = 0;

		var avmread_partial = function(leftbytenum) {
			var bytenum = leftbytenum;
			if (bytenum > avmTransactionMaxLength) bytenum = avmTransactionMaxLength;

			var writepacket = new avmPacket(0x14, bytenum, address+byteoffset, 0);		// �C���N�������^�����[�h�p�P�b�g�𐶐� 

			avmtrans(writepacket, function (result, readpacket) {
				if (result) {
					if (readpacket.byteLength == bytenum) {
						var readpacket_arr = new Uint8Array(readpacket);

						for(var i=0 ; i<bytenum ; i++) readdata_arr[byteoffset++] = readpacket_arr[i];
						leftbytenum -= bytenum;

						console.log("avm : read " + bytenum + "bytes from address 0x" + ("00000000"+address.toString(16)).slice(-8));

						if (leftbytenum > 0) {
							avmread_partial(leftbytenum);
						} else {
							callback(true, readdata);
						}
					} else {
						callback(false, null);
					}
				} else {
					callback(false, null);
				}
			});
		};

		avmread_partial(readbytenum);
	};


	// AvalonMM���������C�g(IOWR_DIRECT)
	//	avmwrite(uint address, arraybuffer writedata[],
	//					function callback(bool result));

	var avmwrite = function(address, writedata, callback) {
		if (!onConnect || !confrun || mresetBarrier) {
			callback(false, null);
			return;
		}

		var writedata_arr = new Uint8Array(writedata);
		var byteoffset = 0;

		var avmwrite_partial = function(leftbytenum) {
			var bytenum = leftbytenum;
			if (bytenum > avmTransactionMaxLength) bytenum = avmTransactionMaxLength;

			var writepacket = new avmPacket(0x04, bytenum, address+byteoffset, bytenum);	// �C���N�������^�����C�g�p�P�b�g�𐶐� 
			var writepacket_arr = new Uint8Array(writepacket);

			for(var i=0 ; i<bytenum ; i++) writepacket_arr[8+i] = writedata_arr[byteoffset++];

			avmtrans(writepacket, function (result, readpacket) {
				if (result) {
					var readpacket_arr = new Uint8Array(readpacket);
					var size = (readpacket_arr[2] << 8) | (readpacket_arr[3] << 0);

					if (readpacket_arr[0] == 0x84 && size == bytenum) {
						leftbytenum -= bytenum;

						console.log("avm : written " + bytenum + "bytes to address 0x" + ("00000000"+address.toString(16)).slice(-8));

						if (leftbytenum > 0) {
							avmwrite_partial(leftbytenum);
						} else {
							callback(true);
						}
					} else {
						callback(false);
					}
				} else {
					callback(false);
				}
			});
		};

		avmwrite_partial(writedata.byteLength);
	};



	//////////////////////////////////////////////////
	//  �������\�b�h (�g�����U�N�V�����R�}���h�Q)
	//////////////////////////////////////////////////

	// �R���t�B�O���[�V�����R�}���h�̑���M 
	//	commandtrans(int command, function callback(bool result, int response);
	var commandBarrier = false;
	var commandtrans = function(command, callback) {

		///// �R�}���h����M�����܂ōĎ��s��j�~���� /////

		if (commandBarrier) {
			callback(false, null);
			return;
		}

		commandBarrier = true;


		///// �R�}���h�̐����Ƒ���M /////

		var send_data = new ArrayBuffer(2);
		var send_data_arr = new Uint8Array(send_data);

		send_data_arr[0] = 0x3a;
		send_data_arr[1] = command & 0xff;
//		console.log("config : send config command = 0x" + ("0"+send_data_arr[1].toString(16)).slice(-2));

		comm.write(send_data, function (result, bytes){
			if (result) {
				comm.read(1, function(result, readnum, readarraybuf) {
					if (result) {
						var resp_data_arr = new Uint8Array(readarraybuf);
						var respbyte = resp_data_arr[0];
//						console.log("config : recieve config response = 0x" + ("0"+respbyte.toString(16)).slice(-2));
						commandtrans_exit(true, respbyte);
					} else {
						commandtrans_exit(false, null);
					}
				});
			} else {
				commandtrans_exit(false, null);
			}
		});

		var commandtrans_exit = function(result, respbyte) {
			commandBarrier = false;
			callback(result, respbyte);
		};
	};


	// AvalonMM�g�����U�N�V�����p�P�b�g���쐬 
	// arraybuffer avmPacket(int command, uint size, uint address, int datasize);
	var avmPacket = function(command, size, address, datasize) {
		var packet = new ArrayBuffer(8 + datasize);
		var packet_arr = new Uint8Array(packet);

		packet_arr[0] = command & 0xff;
		packet_arr[1] = 0x00;
		packet_arr[2] = (size >>> 8) & 0xff;
		packet_arr[3] = (size >>> 0) & 0xff;
		packet_arr[4] = (address >>> 24) & 0xff;
		packet_arr[5] = (address >>> 16) & 0xff;
		packet_arr[6] = (address >>>  8) & 0xff;
		packet_arr[7] = (address >>>  0) & 0xff;

		return packet;
	};


	// �g�����U�N�V�����p�P�b�g�̑���M 
	//	avmtrans(arraybuffer writepacket[],
	//						function callback(bool result, arraybuffer readpacket[]));
	var avmBarrier = false;
	var avmtrans = function(writepacket, callback) {

		///// �p�P�b�g����M�����܂ōĎ��s��j�~���� /////

		if (avmBarrier) {
			callback(false, null);
			return;
		}

		avmBarrier = true;


		///// ���M�p�P�b�g�O���� /////

		var writepacket_arr = new Uint8Array(writepacket);
		var sendarray = new Array();

		sendarray.push(0x7a);		// SOP
		sendarray.push(0x7c);		// CNI
		sendarray.push(0x00);		// Ch.0 (�_�~�[)

		for(var i=0 ; i<writepacket.byteLength ; i++) {
			// EOP�̑}�� 
			if (i == writepacket.byteLength-1) sendarray.push(0x7b);	// EOP 

			// Byte to Packet Converter���̃o�C�g�G�X�P�[�v 
			if (writepacket_arr[i] == 0x7a || writepacket_arr[i] == 0x7b || writepacket_arr[i] == 0x7c || writepacket_arr[i] == 0x7d) {
				sendarray.push(0x7d);
				sendarray.push(writepacket_arr[i] ^ 0x20);

			// PERIDOT Configrator���̃o�C�g�G�X�P�[�v 
			} else if (writepacket_arr[i] == 0x3a || writepacket_arr[i] == 0x3d) {
				sendarray.push(0x3d);
				sendarray.push(writepacket_arr[i] ^ 0x20);

			// ����ȊO 
			} else {
				sendarray.push(writepacket_arr[i]);
			}
		}

		var send_data = new ArrayBuffer(sendarray.length);
		var send_data_arr = new Uint8Array(send_data);

		for(var i=0 ; i<sendarray.length ; i++) send_data_arr[i] = sendarray[i];

//		var sendstr = "";
//		for(var i=0 ; i<send_data.byteLength ; i++) sendstr = sendstr + ("0"+send_data_arr[i].toString(16)).slice(-2) + " ";
//		console.log("avm : sending data = " + sendstr);


		///// �p�P�b�g��M���� /////

		var resparray = new Array();
		var recvlogarray = new Array();		// ���O�p 
		var recvSOP = false;
		var recvEOP = false;
		var recvCNI = false;
		var recvESC = false;

		var avmtrans_recv = function() {
			comm.read(1, function (result, readnum, recvdata) {
				if (result) {
					var recvexit = false;
					var recvdata_arr = new Uint8Array(recvdata);
					var recvbyte = recvdata_arr[0];

					recvlogarray.push(recvbyte);		// ��M�f�[�^��S�ă��O(�e�X�g�p) 

					// �p�P�b�g�t���[���̊O���̏��� 
					if (!recvSOP) {
						if (recvCNI) {				// CNI�̂Q�o�C�g�ڂ̏ꍇ�͓ǂݎ̂Ă� 
							recvCNI = false;
						} else {
							switch(recvbyte) {
							case 0x7a:				// SOP����M 
								recvSOP = true;
								break;

							case 0x7c:				// CNI����M 
								recvCNI = true;
								break;
							}
						}

					// �p�P�b�g�t���[���̓����̏��� 
					} else {
						if (recvCNI) {				// CNI�̂Q�o�C�g�ڂ̏ꍇ�͓ǂݎ̂Ă� 
							recvCNI = false;

						} else if (recvESC) {		// ESC�̂Q�o�C�g�ڂ̏ꍇ�̓o�C�g�������Ēǉ� 
							recvESC = false;
							resparray.push(recvbyte ^ 0x20);

							if (recvEOP) {			// ESC��EOP�̂Q�o�C�g�ڂ������ꍇ�͂����ŏI�� 
								recvEOP = false;
								recvSOP = false;
								recvexit = true;
							}

						} else if (recvEOP) {		// EOP�̂Q�o�C�g�ڂ̏ꍇ�̏��� 
							if (recvbyte == 0x7d) {		// �㑱���o�C�g�G�X�P�[�v����Ă���ꍇ�͑��s 
								recvESC = true;
							} else {					// �G�X�P�[�v�łȂ���΃o�C�g�ǉ����ďI�� 
								resparray.push(recvbyte);
								recvEOP = false;
								recvSOP = false;
								recvexit = true;
							}

						} else {					// ��s�o�C�g���p�P�b�g�w���q�ł͂Ȃ��ꍇ 
							switch(recvbyte) {
							case 0x7a:				// SOP��M 
								break;				// �p�P�b�g���ɂ�SOP�͏o�����Ȃ��̂ŃG���[�ɂ��ׂ��H 

							case 0x7b:				// EOP��M 
								recvEOP = true;
								break;

							case 0x7c:				// CNI��M 
								recvCNI = true;
								break;

							case 0x7d:				// ESC��M 
								recvESC = true;
								break;

							default:				// ����ȊO�̓o�C�g�ǉ�  
								resparray.push(recvbyte);
							}
						}
					}

					if (recvexit) {
						// ���X�|���X�p�P�b�g�̐��` 
						var readpacket = new ArrayBuffer(resparray.length);
						var readpacket_arr = new Uint8Array(readpacket);

						for(var i=0 ; i<resparray.length ; i++) readpacket_arr[i] = resparray[i];

//						var recvstr = "";
//						for(var i=0 ; i<recvlogarray.length ; i++) recvstr = recvstr + ("0"+recvlogarray[i].toString(16)).slice(-2) + " ";
//						console.log("avm : received data = " + recvstr);

						avmtrans_exit(true, readpacket);
					} else {
						avmtrans_recv();
					}

				} else {
					// �o�C�g�f�[�^�̎�M�Ɏ��s�����ꍇ 
					avmtrans_exit(false, null);
				}
			});
		};


		///// �p�P�b�g�̑���M /////

		comm.write(send_data, function (result, bytes) {
			if (result) {
				avmtrans_recv();
			} else {
				avmtrans_exit(false, null);
			}
		});

		var avmtrans_exit = function(result, readpacket) {
			avmBarrier = false;
			callback(result, readpacket);
		};
	};



	//////////////////////////////////////////////////
	//  �������\�b�h (I2C�R�}���h�Q)
	//////////////////////////////////////////////////

	var i2cBarrier = false;

	// 1bit�f�[�^��ǂރT�u�t�@���N�V���� (�K��SCL='L'����s���Ă�����̂Ƃ���) 
	// i2cbitread(function callback(bool result, int readbit));
	var i2cbitread = function(callback) {
		var readbit = 0;
		var timeout = 0;
		var setup = function() {
			commandtrans(0x3b, function(result, respbyte) {		// SDA='Z',SCL='H',�������� 
				if (result) {
					if ((respbyte & 0x10)== 0x10) {				// SCL�������オ������SDA��ǂ� 
						if ((respbyte & 0x20)== 0x20) readbit = 1;
						change();
					} else {
						if (timeout < i2cTimeoutCycle) {
							timeout++;
							setup();
						} else {
							console.log("i2c : [!] Read condition is timeout.");
							callback(false, null);
						}
					}
				} else {
					callback(false, null);
				}
			});
		};

		var change = function() {
			commandtrans(0x2b, function(result, respbyte) {		// SDA='Z',SCL='L',�������� 
				if (result) {
					callback(true, readbit);
				} else {
					callback(false, null);
				}
			});
		};

		setup();
	};

	// 1bit�f�[�^�������T�u�t�@���N�V���� (�K��SCL='L'����s���Ă�����̂Ƃ���) 
	// i2cbitwrite(int writebit, function callback(bool result));
	var i2cbitwrite = function(writebit, callback) {
		var setup = function() {
			var com = (writebit << 5) | 0x0b;
			commandtrans(com, function(result, respbyte) {		// SDA=writebit,SCL='L',�������� 
				if (result) {
					hold();
				} else {
					callback(false);
				}
			});
		};

		var timeout = 0;
		var hold = function() {
			var com = (writebit << 5) | 0x1b;
			commandtrans(com, function(result, respbyte) {		// SDA=writebit,SCL='H',�������� 
				if (result) {
					if ((respbyte & 0x30) == (com & 0x30)) {	// SCL�������オ�����玟�� 
						change();
					} else {
						if (timeout < i2cTimeoutCycle) {
							timeout++;
							hold();
						} else {
							console.log("i2c : [!] Write condition is timeout.");
							callback(false);
						}
					}
				} else {
					callback(false);
				}
			});
		};

		var change = function() {
			var com = (writebit << 5) | 0x0b;
			commandtrans(com, function(result, respbyte) {		// SDA=writebit,SCL='L',�������� 
				if (result) {
					callback(true);
				} else {
					callback(false);
				}
			});
		};

		setup();
	};

	// �X�^�[�g�R���f�B�V�����̑��M 
	// i2cstart(function callback(bool result));
	var i2cstart = function(callback) {
		if (i2cBarrier) {
			callback(false);
			return;
		}

		i2cBarrier = true;

		var timeout = 0;
		var setup = function() {
			commandtrans(0x3b, function(result, respbyte) {		// SDA='H',SCL='H',�������� 
				if (result) {
					if ((respbyte & 0x30)== 0x30) {
						sendstart();
					} else {
						if (timeout < i2cTimeoutCycle) {
							timeout++;
							setup();
						} else {
							console.log("i2c : [!] Start condition is timeout.");
							i2cstart_exit(false);
						}
					}
				} else {
					i2cstart_exit(false);
				}
			});
		};

		var sendstart = function() {
			commandtrans(0x1b, function(result, respbyte) {		// SDA='L',SCL='H',�������� 
				if (result) {
					sclassert();
				} else {
					i2cstart_exit(false);
				}
			});
		};

		var sclassert = function() {
			commandtrans(0x0b, function(result, respbyte) {		// SDA='L',SCL='L',�������� 
				if (result) {
//					console.log("i2c : Start condition.");
					i2cstart_exit(true);
				} else {
					i2cstart_exit(false);
				}
			});
		};

		var i2cstart_exit = function(result) {
			i2cBarrier = false;
			callback(result);
		};

		setup();
	};

	// �X�g�b�v�R���f�B�V�����̑��M (�K��SCL='L'����s���Ă�����̂Ƃ���) 
	// i2cstop(function callback(bool result));
	var i2cstop = function(callback) {
		if (i2cBarrier) {
			callback(false);
			return;
		}

		i2cBarrier = true;

		var timeout = 0;
		var setup = function() {
			commandtrans(0x0b, function(result, respbyte) {		// SDA='L',SCL='L',�������� 
				if (result) {
					sclrelease();
				} else {
					i2cstop_exit(false);
				}
			});
		};

		var sclrelease = function() {
			commandtrans(0x1b, function(result, respbyte) {		// SDA='L',SCL='H',�������� 
				if (result) {
					if ((respbyte & 0x30)== 0x10) {
						timeout = 0;
						sendstop();
					} else {
						if (timeout < i2cTimeoutCycle) {
							timeout++;
							setup();
						} else {
							console.log("i2c : [!] Stop condition is timeout.");
							i2cstop_exit(false);
						}
					}
				} else {
					i2cstop_exit(false);
				}
			});
		};

		var sendstop = function() {
			var com = 0x39;
			if (avmSendImmediate) com |= 0x02;					// �����������[�h�r�b�g 

			commandtrans(com, function(result, respbyte) {		// SDA='H',SCL='H' 
				if (result) {
					if ((respbyte & 0x30)== 0x30) {
//						console.log("i2c : Stop condition.");
						i2cstop_exit(true);
					} else {
						if (timeout < i2cTimeoutCycle) {
							timeout++;
							sendstop();
						} else {
							console.log("i2c : [!] Stop condition is timeout.");
							i2cstop_exit(false);
						}
					}
				} else {
					i2cstop_exit(false);
				}
			});
		};

		var i2cstop_exit = function(result) {
			i2cBarrier = false;
			callback(result);
		};

		setup();
	};

	// �o�C�g���[�h (�K��SCL='L'����s���Ă�����̂Ƃ���) 
	// i2cread(bool ack, function callback(bool result, int readbyte));
	var i2cread = function(ack, callback) {
		if (i2cBarrier) {
			callback(false, null);
			return;
		}

		i2cBarrier = true;

		var bitnum = 0;
		var readbyte = 0x00;

		var byteread = function() {
			i2cbitread(function(result, readbit) {
				if (result) {
					readbyte |= readbit;
	
					if (bitnum < 7) {
						bitnum++;
						readbyte <<= 1;
						byteread();
					} else {
						sendack();
					}
				} else {
					i2cread_exit(false, null);
				}
			});
		};

		var sendack = function() {
			var ackbit = 0;
			if (!ack) ackbit = 1;	// NACK

			i2cbitwrite(ackbit, function(result) {
				if (result) {

//					var str = " ACK";
//					if (!ack) str = " NACK";
//					console.log("i2c : read 0x" + ("0"+readbyte.toString(16)).slice(-2) + str);

					i2cread_exit(true, readbyte);
				} else {
					i2cread_exit(false, null);
				}
			});

		};

		var i2cread_exit = function(result, respbyte) {
			i2cBarrier = false;
			callback(result, respbyte);
		};

		byteread();
	};

	// �o�C�g���C�g (�K��SCL='L'����s���Ă�����̂Ƃ���) 
	// i2cwrite(int writebyte, function callback(bool result, bool ack));
	var i2cwrite = function(writebyte, callback) {
		if (i2cBarrier) {
			callback(false);
			return;
		}

		i2cBarrier = true;

		var bitnum = 0;
		var senddata = writebyte;
		var bytewrite = function() {
			var writebit = 0;
			if ((senddata & 0x80)!= 0x00) writebit = 1;

			i2cbitwrite(writebit, function(result) {
				if (result) {
					if (bitnum < 7) {
						bitnum++;
						senddata <<= 1;
						bytewrite();
					} else {
						recvack();
					}
				} else {
					i2cwrite_exit(false, null);
				}
			});
		};

		var recvack = function() {
			i2cbitread(function(result, readbit) {
				if (result) {
					var ack = true;
					if (readbit != 0) ack = false;

//					var str = " ACK";
//					if (!ack) str = " NACK";
//					console.log("i2c : write 0x" + ("0"+writebyte.toString(16)).slice(-2) + str);

					i2cwrite_exit(true, ack);
				} else {
					i2cwrite_exit(false, null);
				}
			});
		};

		var i2cwrite_exit = function(result, ack) {
			i2cBarrier = false;
			callback(result, ack);
		};

		bytewrite();
	};


	// �{�[�h��EEPROM��ǂݏo�� 
	// eepromread(int startaddr, int readbytes, function callback(bool result, arraybuffer readdata[]));
	var eepromBarrier = false;
	var eepromread = function(startaddr, readbytes, callback) {
		if (eepromBarrier) {
			callback(false, null);
			return;
		}

		eepromBarrier = true;
		var si_backup = avmSendImmediate;
		avmSendImmediate = true;

		var deviceaddr = 0xa0;
		var readdata = new ArrayBuffer(readbytes);
		var readdata_arr = new Uint8Array(readdata);

		var byteread = function(byteaddr, callback) {
			var data = null;

			var start = function() {
				i2cstart(function(result) {
					if (result) {
						devwriteopen();
					} else {
						exit();
					}
				});
			};

			var devwriteopen = function() {
				i2cwrite((deviceaddr | 0), function(result, ack) {
					if (result && ack) {
						setaddr();
					} else {
						console.log("i2c : [!] Device 0x" + ("0"+deviceaddr.toString(16)).slice(-2) + " is not found.");
						devclose();
					}
				});
			};

			var setaddr = function() {
				i2cwrite(byteaddr, function(result, ack) {
					if (result && ack) {
						repstart();
					} else {
						devclose();
					}
				});
			};

			var repstart = function() {
				i2cstart(function(result) {
					if (result) {
						devreadopen();
					} else {
						devclose();
					}
				});
			};

			var devreadopen = function() {
				i2cwrite((deviceaddr | 1), function(result, ack) {
					if (result && ack) {
						readdata();
					} else {
						devclose();
					}
				});
			};

			var readdata = function() {
				i2cread(false, function(result, readbyte) {
					if (result) {
						data = readbyte;
					}
					devclose();
				});
			};

			var devclose = function() {
				i2cstop(function(res) {
					exit();
				});
			};

			var exit = function() {
				if (data != null) {
					callback(true, data);
				} else {
					callback(false, data);
				}
			};

			start();
		};

		var bytenum = 0;
		var idread = function() {
			byteread(startaddr, function(result, data) {
				if (result) {
					readdata_arr[bytenum++] = data;

					if (bytenum < readdata.byteLength) {
						startaddr++;
						idread();
					} else {
						eepromread_exit(true, readdata);
					}
				} else {
					eepromread_exit(false, null);
				}
			});
		};

		var eepromread_exit = function(result, databuf) {
			eepromBarrier = false;
			avmSendImmediate = si_backup;
			callback(result, databuf);
		};

		idread();
	}
}

