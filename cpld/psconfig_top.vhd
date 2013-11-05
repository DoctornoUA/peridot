-- ===================================================================
-- TITLE : Physicaloid FPGA �R���p�j�I��CPLD (Peri-DOT�p) 
--
--     DESIGN : S.OSAFUNE (J-7SYSTEM Works)
--     DATE   : 2013/08/20 -> 2013/09/03
--     UPDATE : 2013/09/29 AS���[�h����mreset��nconfig���A�T�[�g����悤�C�� 
--              2013/10/22 �������o(SI/WU#)����r�b�g��ǉ� 
-- ===================================================================
-- *******************************************************************
--   Copyright (C) 2013, J-7SYSTEM Works.  All rights Reserved.
--
-- * This module is a free sourcecode and there is NO WARRANTY.
-- * No restriction on use. You can use, modify and redistribute it
--   for personal, non-profit or commercial products UNDER YOUR
--   RESPONSIBILITY.
-- * Redistributions of source code must retain the above copyright
--   notice.
-- *******************************************************************

-- ���� 
--	AS���[�h�N���Ńz�X�g�s�݁iUSB��P�Ȃ�d���|�[�g�Ƃ��Ďg���j�̏ꍇ�AFPGA����SCIF��
--	�^�C���A�E�g�����������������ǂ��iAvalonMM Bridge�Ȃ�s�v�j 


-- ���R�}���h�o�C�g 
--
--		���M�o�C�g�� : 0x3A nn (2�o�C�g�Œ�)
--
--			bit0 : nCONFIG�̒l('0'=L���x���o�� / '1'=H���x���o��)
--			bit1 : �������[�h�ݒ�('0'=�ʏ� / '1'=��������)
--			bit2 : �����`�F�b�N�T�����[�h���N�G�X�g(���'0'��ݒ�)
--			bit3 : ���[�h�ݒ�('0'=�R���t�B�O���[�h / '1'=���[�U�[���[�h)
--			bit4 : I2C SCL�o��('0'=L�ɋ쓮 / '1'=Hi-Z)
--			bit5 : I2C SDA�o��('0'=L�ɋ쓮 / '1'=Hi-Z)
--			bit6-7 : �\��('0'��ݒ�)
--
--		�ԐM�o�C�g�� : nn (1�o�C�g�Œ�)
--
--			bit0 : MSEL1�̒l('0'=PS���[�h / '1'=AS���[�h)
--			bit1 : nSTATUS�̒l('0'=L���x�� / '1'=H���x��)
--			bit2 : CONF_DONE�̒l(�@�V�@)
--			bit3 : FPGA�����̃^�C���A�E�g('0'=�ʏ� / '1'=�^�C���A�E�g����) ���I�v�V���� 
--			bit4 : I2C SCL�̒l('0'=L���x�� / '1'=H���x��)
--			bit5 : I2C SDA�̒l(�@�V�@)
--			bit6-7 : �\��('0'��Ԃ�)
--
--
-- ���f�[�^�o�C�g�G�X�P�[�u 
--
--		0x3A�����0x3D��CPLD�̒��ŃR�}���h�o�C�g�A�G�X�P�[�v�o�C�g�Ƃ��ď�������邽�߁A 
--		�f�[�^(�R���t�B�O�܂�)�ɂ��̒l���܂܂��ꍇ�́A���L�̎菇�ŃG�X�P�[�v����B 
--
--		�E���M 
--			0x3A�����0x3D�𑗂�ꍇ��0x20��xor�����l���A0x3D�̌�ɑ���B 
--			�G�X�P�[�v�̕�����CPLD�ōs����B 
--
--			��j0x01 0x3a 0x7f 0x3d �� 0x01 0x3d 0x1a 0x7f 0x3d 0x1d
--                   ^^^^      ^^^^         ~~~~ ^^^^      ~~~~ ^^^^
--		�E��M 
--			��M�ɂ̓G�X�P�[�v�����͖��� 
--
--
-- ��FPGA�̃R���t�B�O���[�V���� 
--
--		�z�X�g����FPGA�̃R���t�B�O���[�V�������s���ꍇ�͉��L�̎菇�ōs���B 
--
--		(1) 0x3A 0x39 �𑗐M�B�Ԓl��bit0��1�̏ꍇ��RBF�̃_�E�����[�h�͂ł��Ȃ��B 
--		(2) 0x3A 0x30 �𑗐M�B�Ԓl��bit1�Abit2�������Ƃ�0�ɂȂ�܂ŌJ��Ԃ��B 
--		(3) 0x3A 0x31 �𑗐M�B�Ԓl��bit1��1�ɂȂ�܂ŌJ��Ԃ��B 
--		(4) RBF�t�@�C���𑗐M�B0x3A,0x3D���o������ꍇ�̓o�C�g�G�X�P�[�v�����邱�ƁB 
--		(5) 0x3A 0x31 �𑗐M�B�Ԓl��bit1�Abit2�������Ƃ�1�ɂȂ��Ă��Ȃ��ꍇ�̓G���[�B 
--			���g���C������ꍇ��(2)����J��Ԃ��B 
--		(6) 0x3A 0x39 �𑗐M�B�Ԓl�͓ǂݎ̂Ă�B���[�U�[���[�h�ɑJ�ځB 
--
--
-- ��FPGA�̃z�X�g������̃��Z�b�g 
--
--		�Ȃ�炩�̕s�����������FPGA���������Ȃ��Ȃ����ꍇ�A2.7�b�Ń^�C���A�E�g����B 
--		�^�C���A�E�g���FPGA�̒ʐM���ؒf����A�������[�h�݂̂̓���ɂȂ�B 
--		�^�C���A�E�g��Ԃ̓R���t�B�O���[�h�J�ڂŉ��������B 
--		�ăR���t�B�O�����Ƀ��Z�b�g�������s����ꍇ�͉��L�̎菇�ōs���B 
--
--		(1) 0x3A 0x31 �𑗐M�B�Ԓl�͓ǂݎ̂Ă�B�V�X�e�����Z�b�g���A�T�[�g�����B 
--		(2) 0x3A 0x39 �𑗐M�B�Ԓl�͓ǂݎ̂Ă�B���[�U�[���[�h�ɑJ�ځB 
--
--
-- ��FPGA�Ƃ̒ʐM 
--
--		�E�t���[���t�H�[�}�b�g 
--			�P�t���[��10�r�b�g�̓������̒����ʐM�Ńf�[�^�����Ƃ肷��B 
--			�r�b�g�t�H�[�}�b�g��1�X�^�[�g�A1�X�g�b�v�A�f�[�^8bit�ALSB�t�@�[�X�g�B 
--			�N���b�N��12MHz�A�f�[�^�͑o���Ƃ��N���b�N�̗���������ŃZ�b�g�A�����オ��Ń��b�`����B 
--			�������W�b�N��24MHz�̓���Ƃ���B 
--
--		�E���M�� 
--				      0     1     2     3     4     5     6     7     8     9
--		SCLK  __|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|_�d�d 
--
--		TXD   ~~~~~|_____/ TD0 X TD1 X TD2 X TD3 X TD4 X TD5 X TD6 X TD7 /~~~~~XXXXXXXX�d�d 
--
--		/TXR  ~~~~~|_____XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX�d�d 
--
--			nTXR�͑��葤�̎󂯓���\�M���B���̐M�����A�T�[�g�̎��ɑ��M���s���B 
--			�����M��Ԃ̂܂ܑҋ@���������ꍇ�A2.7�b��CPLD�����^�C���A�E�g����B 
--
--		�E��M�� 
--				      0     1     2     3     4     5     6     7     8     9
--		SCLK  __|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|__|~~|_�d�d 
--
--		RXD   ~~~~~|_____/ RD0 X RD1 X RD2 X RD3 X RD4 X RD5 X RD6 X RD7 /~~~~~XXXXXXXX�d�d 
--
--		/RXR  ~~~~~|_____XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX�d�d 
--
--			nRXR�͂�����̃f�[�^��M���\�ɂȂ������Ƃ𑊎葤�ɒʒm����B 
--
--		�E�ʐM�v���g�R�� 
--			FPGA�Ƃ̒ʐM�v���g�R����AvalonMM Packet Transaction����������B 
--
--
-- 2013/10/22 Syun OSAFUNE <s.osafune@gmail.com>

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.std_logic_arith.all;
use IEEE.std_logic_unsigned.all;

entity psconfig_top is
	port(
		clk24mhz		: in  std_logic;

--		clk6mhz_out		: out std_logic;	-- FT245BM Drive clock
		ud				: inout std_logic_vector(7 downto 0);	-- FT240 Data
		rd_n			: out std_logic;	-- FT240 Data read signal(Active Low)
		wr				: out std_logic;	-- FT240 Data write signal(Active High)
		rxf_n			: in  std_logic;	-- FT240 Data read ready(Active Low)
		txe_n			: in  std_logic;	-- FT240 Data write ready(Active Low)
		si_wu_n			: out std_logic;	-- FT240 Send Immediate(Active Low)

		dclk			: out std_logic;
		data0			: out std_logic;
		nconfig			: out std_logic;
		nstatus			: in  std_logic;
		confdone		: in  std_logic;
		msel1			: in  std_logic;

		conn_tck_in		: in  std_logic;
		conn_tdi_in		: in  std_logic;
		conn_tdo_out	: out std_logic;
		conn_tms_in		: in  std_logic;
		tck				: out std_logic;
		tdi				: out std_logic;
		tdo				: in  std_logic;
		tms				: out std_logic;

		reset_n_out		: out std_logic;
		sci_sclk		: out std_logic;
		sci_txr_n		: in  std_logic;
		sci_txd			: out std_logic;
		sci_rxr_n		: out std_logic;
		sci_rxd			: in  std_logic;

		i2c_scl			: inout std_logic;
		i2c_sda			: inout std_logic;

		mreset_n_in		: in  std_logic;		-- Manual ResetSW in
		mreset_n_ext	: inout std_logic;		-- External Reset Control
		led_n_out		: out std_logic			-- User LED (Active Low)
	);
end psconfig_top;

architecture RTL of psconfig_top is
	constant WAITRESET_COUNTMAX	: integer := 31;			-- internal reset count(9.6us at 3.33MHz)
	constant TIMEOUT_COUNT		: integer := 67100000;		-- txr timeout count(2.79s at 24MHz)

	component max2_internal_osc
	PORT(
		oscena	: IN STD_LOGIC ;
		osc		: OUT STD_LOGIC 
	);
	end component;
	signal intosc_sig		: std_logic;					-- MAX II internal osc(3.33MHz typ)
	signal intreset_count	: integer range 0 to WAITRESET_COUNTMAX := 0;
	signal intreset_n_reg	: std_logic := '0';
	signal clkdiv_count_reg	: std_logic_vector(1 downto 0);
	signal reset_sig		: std_logic;
	signal clock_sig		: std_logic;
	signal extreset_n_sig	: std_logic;
	signal led_ready_sig	: std_logic;
	signal led_error_sig	: std_logic;
	signal msel1_sig		: std_logic;
	signal mreset_in_sig	: std_logic;

	type CONF_STATE is (IDLE,
						CONFIG_ACK, GETPARAM, SETRESP,
						ESCAPE_ACK, THROW);
	signal psstate : CONF_STATE;
	signal bytedlop_reg		: std_logic;
	signal escape_reg		: std_logic;
	signal usermode_reg		: std_logic;
	signal nconfig_reg		: std_logic;
	signal nstatus_reg		: std_logic;
	signal confdone_reg		: std_logic;
	signal timeout_reg		: std_logic;
	signal tocount_reg		: std_logic_vector(25 downto 0);
	signal respdata_sig		: std_logic_vector(7 downto 0);
	signal sclout_reg		: std_logic;
	signal sdaout_reg		: std_logic;
	signal sclin_sig		: std_logic;
	signal sdain_sig		: std_logic;
	signal sendimm_reg		: std_logic;


	component avalonst_byte_to_usbfifo
	port(
		clock			: in  std_logic;
		reset			: in  std_logic;

		out_ready		: in  std_logic;
		out_valid		: out std_logic;
		out_data		: out std_logic_vector(7 downto 0);

		in_ready		: out std_logic;
		in_valid		: in  std_logic;
		in_data			: in  std_logic_vector(7 downto 0);

		ft_data			: inout std_logic_vector(7 downto 0);
		ft_rd_n			: out std_logic;
		ft_wr			: out std_logic;
		ft_rxf_n		: in  std_logic;
		ft_txe_n		: in  std_logic
	);
	end component;
	signal usb_rxready_sig	: std_logic;
	signal usb_rxdata_sig	: std_logic_vector(7 downto 0);
	signal usb_rxvalid_sig	: std_logic;
	signal usb_txready_sig	: std_logic;
	signal usb_txdata_sig	: std_logic_vector(7 downto 0);
	signal usb_txvalid_sig	: std_logic;

	component avalonst_byte_to_scif
	port(
		clock			: in  std_logic;
		reset			: in  std_logic;

		out_ready		: in  std_logic;
		out_valid		: out std_logic;
		out_data		: out std_logic_vector(7 downto 0);

		in_ready		: out std_logic;
		in_channel		: in  std_logic_vector(0 downto 0);	-- ch.0 : SCI / ch.1 : PSconf
		in_valid		: in  std_logic;
		in_data			: in  std_logic_vector(7 downto 0);

		sci_sclk		: out std_logic;
		sci_txr_n		: in  std_logic;
		sci_txd			: out std_logic;
		sci_rxr_n		: out std_logic;
		sci_rxd			: in  std_logic;

		conf_dclk		: out std_logic;
		conf_data0		: out std_logic
	);
	end component;
	signal sci_rxr_n_sig	: std_logic;
	signal sci_rxready_sig	: std_logic;
	signal sci_rxdata_sig	: std_logic_vector(7 downto 0);
	signal sci_rxvalid_sig	: std_logic;
	signal sci_txready_sig	: std_logic;
	signal sci_txchannel_sig: std_logic_vector(0 downto 0);
	signal sci_txdata_sig	: std_logic_vector(7 downto 0);
	signal sci_txvalid_sig	: std_logic;
	signal confdclk_sig		: std_logic;
	signal confdata0_sig	: std_logic;

--	signal checksum_reg		: std_logic_vector(7 downto 0);
--	signal readsum_reg		: std_logic;

begin

	----------------------------------------------
	-- 6MHz�N���b�N���� (DE0�̂�)
	----------------------------------------------

--	process (clk24mhz) begin
--		if (clk24mhz'event and clk24mhz = '1') then
--			clkdiv_count_reg <= clkdiv_count_reg + 1;
--		end if;
--	end process;
--
--	clk6mhz_out <= clkdiv_count_reg(1);		-- 1/4 clk 



	----------------------------------------------
	-- �`�F�b�N�T��(DE0�e�X�g�p) 
	----------------------------------------------
	-- CH1�̎���SCIF�ɓ������o�C�g�̃`�F�b�N�T�����v�Z 
	-- ���[�U�[���[�h�ɑJ�ڂ���ƃ��Z�b�g 

--	process (clock_sig, reset_sig) begin
--		if (reset_sig = '1') then
--			checksum_reg <= X"00";
--
--		elsif (clock_sig'event and clock_sig = '1') then
--			if (usermode_reg = '1') then
--				checksum_reg <= X"00";
--			elsif (sci_txvalid_sig = '1' and sci_txready_sig = '1') then
--				checksum_reg <= checksum_reg + sci_txdata_sig;
--			end if;
--
--		end if;
--	end process;



	----------------------------------------------
	-- �N���b�N�A���Z�b�g�M������ 
	----------------------------------------------

	clock_sig <= clk24mhz;

	osc_inst : max2_internal_osc
	port map (
		oscena	=> '1',
		osc		=> intosc_sig
	);

	process (intosc_sig) begin
		if (intosc_sig'event and intosc_sig = '1') then
			if (intreset_count = WAITRESET_COUNTMAX) then
				intreset_n_reg <= '1';
			else
				intreset_count <= intreset_count + 1;
			end if;
		end if;
	end process;

	reset_sig <= not intreset_n_reg;

	mreset_in_sig <= not mreset_n_in;

	mreset_n_ext <= '0' when(mreset_in_sig = '1' or reset_sig = '1' or usermode_reg = '0') else 'Z';
	extreset_n_sig <= mreset_n_ext;

	msel1_sig <= msel1;


	-- LED�\�� 

	led_ready_sig <= '1' when(usermode_reg ='1' and confdone = '1') else '0';
	led_error_sig <= tocount_reg(22) when(timeout_reg = '1') else '0';

	led_n_out <= '0' when(led_ready_sig = '1' and led_error_sig = '0') else '1';


	-- JTAG�X���[�ڑ� 

	tck <= conn_tck_in;
	tms <= conn_tms_in;
	tdi <= conn_tdi_in;
	conn_tdo_out <= tdo;



	----------------------------------------------
	-- �R���t�B�O���[�V�����V�[�P���T 
	----------------------------------------------

	reset_n_out <= '0' when(usermode_reg = '0') else extreset_n_sig;

	dclk  <= confdclk_sig when(usermode_reg = '0') else 'Z';
	data0 <= confdata0_sig when(usermode_reg = '0') else 'Z';

	nconfig <= '0' when((msel1_sig = '0' and nconfig_reg = '0')or(msel1_sig = '1' and mreset_in_sig = '1')) else 'Z';

	usb_rxready_sig <= usb_rxvalid_sig when(bytedlop_reg = '1' or timeout_reg = '1') else
						sci_txready_sig when(psstate = THROW) else
						'0';
	sci_txvalid_sig <= usb_rxvalid_sig when(psstate = THROW and timeout_reg = '0') else '0';
	sci_txdata_sig <= (usb_rxdata_sig xor X"20") when(escape_reg = '1') else usb_rxdata_sig;
	sci_txchannel_sig <= "0" when(usermode_reg = '1') else "1";

	sci_rxready_sig <= '0' when(psstate = SETRESP) else usb_txready_sig;
	usb_txvalid_sig <= '1' when(psstate = SETRESP) else sci_rxvalid_sig;
	usb_txdata_sig <= respdata_sig when(psstate = SETRESP) else sci_rxdata_sig;

	i2c_scl <= '0' when(sclout_reg = '0') else 'Z';
	sclin_sig <= i2c_scl;
	i2c_sda <= '0' when(sdaout_reg = '0') else 'Z';
	sdain_sig <= i2c_sda;

	respdata_sig <= --checksum_reg when(readsum_reg = '1') else
					"00" & sdain_sig & sclin_sig & timeout_reg & confdone_reg & nstatus_reg & msel1_sig;

	process (clock_sig, reset_sig) begin
		if (reset_sig = '1') then
			psstate <= IDLE;
			bytedlop_reg <= '0';
			escape_reg   <= '0';
--			readsum_reg  <= '0';
			usermode_reg <= '1';
			nconfig_reg  <= '1';
			timeout_reg  <= '0';
			tocount_reg  <= (others=>'0');
			sclout_reg   <= '1';
			sdaout_reg   <= '1';
			sendimm_reg  <= '0';

		elsif (clock_sig'event and clock_sig = '1') then

			-- ���C���X�e�[�g�}�V�� 

			case psstate is
			when IDLE =>
				if (usb_rxvalid_sig = '1') then
					if (usb_rxdata_sig = X"3A") then
						psstate <= CONFIG_ACK;
						bytedlop_reg <= '1';
					elsif (usb_rxdata_sig = X"3D") then
						psstate <= ESCAPE_ACK;
						bytedlop_reg <= '1';
						escape_reg   <= '1';
					else
						psstate <= THROW;
					end if;
				end if;

			when CONFIG_ACK =>
				psstate <= GETPARAM;

			when GETPARAM =>
				if (usb_rxvalid_sig = '1') then
					psstate <= SETRESP;
					bytedlop_reg <= '0';
					nconfig_reg  <= usb_rxdata_sig(0);
					sendimm_reg  <= usb_rxdata_sig(1);
--					readsum_reg  <= usb_rxdata_sig(2);
					usermode_reg <= usb_rxdata_sig(3);
					sclout_reg   <= usb_rxdata_sig(4);
					sdaout_reg   <= usb_rxdata_sig(5);
					nstatus_reg  <= nstatus;
					confdone_reg <= confdone;
				end if;

			when SETRESP =>
				if (usb_txready_sig = '1') then
					psstate <= IDLE;
				end if;

			when ESCAPE_ACK =>
				psstate <= THROW;
				bytedlop_reg <= '0';

			when THROW =>
				if (timeout_reg = '1') then
					psstate <= IDLE;
				elsif (sci_txready_sig = '1') then
					psstate <= IDLE;
					escape_reg <= '0';
				end if;

			end case;


			-- �^�C���A�E�g�J�E���^���� 

			if (timeout_reg = '1' or(timeout_reg = '0' and psstate = THROW)) then
				tocount_reg <= tocount_reg + 1;
			else
				tocount_reg <= (others=>'0');
			end if;

			if (timeout_reg = '1') then
				if (usermode_reg = '0') then
					timeout_reg <= '0';			-- �R���t�B�O���[�h�J�ڂŃN���A 
				end if;
			else
				if (tocount_reg = TIMEOUT_COUNT) then
					timeout_reg <= '1';
				end if;
			end if;

		end if;
	end process;



	----------------------------------------------
	-- FT245/FPGA�C���^�[�t�F�[�X 
	----------------------------------------------

	-- FT245�񓯊�FIFO 

	si_wu_n <= '0' when(sendimm_reg = '1') else '1';

	inst_ftif : avalonst_byte_to_usbfifo
	port map(
		clock		=> clock_sig,
		reset		=> reset_sig,
		out_ready	=> usb_rxready_sig,
		out_valid	=> usb_rxvalid_sig,
		out_data	=> usb_rxdata_sig,
		in_ready	=> usb_txready_sig,
		in_valid	=> usb_txvalid_sig,
		in_data		=> usb_txdata_sig,

		ft_data		=> ud,
		ft_rd_n		=> rd_n,
		ft_wr		=> wr,
		ft_rxf_n	=> rxf_n,
		ft_txe_n	=> txe_n
	);


	-- FPGA�����V���A�� 

	sci_rxr_n <= sci_rxr_n_sig when(usermode_reg = '1') else '1';

	inst_scif : avalonst_byte_to_scif
	port map(
		clock		=> clock_sig,
		reset		=> reset_sig,
		out_ready	=> sci_rxready_sig,
		out_valid	=> sci_rxvalid_sig,
		out_data	=> sci_rxdata_sig,
		in_ready	=> sci_txready_sig,
		in_channel	=> sci_txchannel_sig,
		in_valid	=> sci_txvalid_sig,
		in_data		=> sci_txdata_sig,

		sci_sclk	=> sci_sclk,
		sci_txr_n	=> sci_txr_n,
		sci_txd		=> sci_txd,
		sci_rxr_n	=> sci_rxr_n_sig,
		sci_rxd		=> sci_rxd,

		conf_dclk	=> confdclk_sig,
		conf_data0	=> confdata0_sig
	);



end RTL;


