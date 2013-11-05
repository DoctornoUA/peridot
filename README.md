Physicaloid FPGA - 'PERIDOT'
============================

Overview
-----------------
PERIDOT(�y���h�b�g)��Physicaloid�ɑΉ�����Arduino�t�H�[���t�@�N�^��FPGA��ł��B
Physicaloid���C�u�����𗘗p���邱�ƂŁAAndroid��Google Chrome����̃t�B�W�J���R���s���[�e�B���O���\�ɂ��܂��B

'PERIDOT' is a FPGA board Arduino form factor corresponding to the Physicaloid.
By taking advantage of Physicaloid library, allowing you to physical computing from Google Chrome and Android.

![Welcome to Physicaloid](https://lh6.googleusercontent.com/-RWdnQPTTfdc/UnhUNfMT-sI/AAAAAAAAFr4/ZsmrO3t93lI/w668-h376-no/physicaloid_wp2_1920x1080.jpg)


Features
-----------------
- Android/Chrome����̃R���t�B�O���[�V����
- USB�V���A���C���^�[�t�F�[�X�o�R�ł�FPGA�����ւ̃A�N�Z�X
- ALTERA CycloneIV E (EP4CE6E22C8N)����
- 64Mbit SDRAM (up to 133MHz)����
- 28�{�̃��[�U�[I/O
- �X�^���h�A����������T�|�[�g
- USB���d�݂̂œ���OK (�ߓd���ی��H����)
- Arduino�V�[���h�̗��p�\(�����������)
- �I�[�v���\�[�X (�N���G�C�e�B�u�R�����Y�ECC BY 2.1)
  
- Configuration from the Android / Chrome.
- Provides access to the FPGA inside of a USB serial interface via.
- ALTERA CycloneIV E(EP4CE6E22C8N)
- 64Mbit SDRAM (up to 133MHz)
- User I/O of the 28 pins
- Support a stand-alone operation.
- Only USB power supply (On-board overcurrent protection).
- Possible diversion of Arduino shield (Due or later).
- Open-source (Creative Commons, CC BY 2.1)


Interface
-----------------
![PERIDOT Board Connector](https://lh3.googleusercontent.com/-mjnC-a-mvtM/UnhcuaqQL0I/AAAAAAAAFso/zZeyUkh4efw/w600-h468-no/peridot_board_connector.png)
- Manual RESET Key
�V�X�e���S�̂̃}�j���A�����Z�b�g���s���܂��B
- JTAG Connector
FPGA��JTAG�s�����z�u����Ă��܂��B
- Config MODE Selector
�{�[�h�̃R���t�B�O���[�h��؂�ւ��܂��B�X�^���h�A�����œ��삳����ꍇ��AS���ɁA�z�X�g����Physicaloid���C�u�����ŃR���t�B�O���s���ꍇ��PS���ɃZ�b�g���܂��B
- Power supply and RESET
�V�[���h�ւ̓d�������ƃ��Z�b�g�M�����o�͂���܂��B�d����3.3V/100mA�AUSB 5V/100mA���g�p�ł��܂��B�ő�d����USB�z�X�g�Ő�������܂��B
- Digital I/O
FPGA��I/O�s�����z�u����Ă��܂��B3.3V�𒴂���d����������Ȃ��ŉ������B
  
- Manual RESET Key
Manual reset of the entire system.
- JTAG Connector
JTAG pins of the FPGA are located.
- Config MODE Selector
Switching configuration mode of the board.
Set the AS side when operating in a stand-alone. Set PS side when performing configuration in Physicaloid library from the host.
- Power supply and RESET
It outputs a reset signal and power supply to the shield.
Power can be used 3.3V/100mA, USB 5V/100mA. Maximum current is limited by the USB host.
- Digital I/O
I/O pins of the FPGA are located. Do not apply a voltage of more than 3.3V.


Board block diagram and schematic
---------------------------------
![PERIDOT Block diagram](https://lh3.googleusercontent.com/-XpoVXE45BRU/UnhcutSOYOI/AAAAAAAAFss/-6QsIh6Is40/w700-h327-no/peridot_block.png)

(\*1) ASDI�̓X�^���h�A�������[�h�ł̂ݗL���ɂȂ�܂��B
(\*2) �X�^���h�A�������[�h�ł̓��R���t�B�O�L�[�ɂȂ�܂��B

(\*1) ASDI is only available in stand-alone mode.
(\*2) It becomes the reconfiguration key in stand-alone mode.


[Board schematic](https://github.com/osafune/peridot/blob/master/pcb/peridot_pcb_ver1.0.pdf)


License
-----------------
PERIDOT Hardware is released under the [Creative Commons,CC BY 2.1 JP](http://creativecommons.org/licenses/by/2.1/jp/legalcode)
![CC BY](http://creativecommons.jp/wp/wp-content/uploads/2009/10/by.png)
