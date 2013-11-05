-- ===================================================================
-- TITLE : FT245�񓯊�FIFO�C���^�[�t�F�[�X 
--
--     DESIGN : S.OSAFUNE (J-7SYSTEM Works)
--     DATE   : 2013/08/20 -> 2013/09/03
--     UPDATE :
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

-- FT245/FT240X�̔񓯊�FIFO��AvalonST�Ƀu���b�W���� 
--
-- ���݂̃o�[�W�����ł�FT245�񓯊�FIFO�̃^�C�~���O��24MHz�N���b�N�� 
-- ��Ƀn�[�h�R�[�h���Ă���B�N���b�N��ύX����ꍇ�ɂ͗v�C���B 

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.std_logic_arith.all;
use IEEE.std_logic_unsigned.all;

entity avalonst_byte_to_usbfifo is
	port(
		-- Interface: clock
		clock			: in  std_logic;		-- 24MHz typ.
		reset			: in  std_logic;

		-- Interface: ST out
		out_ready		: in  std_logic;
		out_valid		: out std_logic;
		out_data		: out std_logic_vector(7 downto 0);

		-- Interface: ST in
		in_ready		: out std_logic;
		in_valid		: in  std_logic;
		in_data			: in  std_logic_vector(7 downto 0);

		-- External: FTDI Async FIFO
		ft_data			: inout std_logic_vector(7 downto 0);
		ft_rd_n			: out std_logic;
		ft_wr			: out std_logic;
		ft_rxf_n		: in  std_logic;
		ft_txe_n		: in  std_logic
	);
end avalonst_byte_to_usbfifo;

architecture RTL of avalonst_byte_to_usbfifo is
	type FTIF_STATE is (IDLE,
						FT_RDWAIT1,FT_RDWAIT2,FT_GETBYTE,FT_RXFWAIT,
						FT_SETBYTE,FT_WRWAIT1,FT_WRWAIT2,FT_TXEWAIT);
	signal ifstate : FTIF_STATE;
	signal ft_rd_reg		: std_logic;
	signal ft_wr_reg		: std_logic;
	signal ft_doe_reg		: std_logic;
	signal ft_rxf_sig		: std_logic;
	signal ft_txe_sig		: std_logic;
	signal ft_rxf_reg		: std_logic_vector(1 downto 0);
	signal ft_txe_reg		: std_logic_vector(1 downto 0);
	signal getbytereq_sig	: std_logic;
	signal getbytedata_sig	: std_logic_vector(7 downto 0);
	signal getbyteack_sig	: std_logic;
	signal setbytereq_sig	: std_logic;
	signal setbytedata_sig	: std_logic_vector(7 downto 0);
	signal setbyteack_sig	: std_logic;

	signal outvalid_reg		: std_logic;
	signal outdata_reg		: std_logic_vector(7 downto 0);


begin

	----------------------------------------------
	-- AvalonST�C���^�[�t�F�[�X 
	----------------------------------------------

	out_data  <= outdata_reg;
	out_valid <= outvalid_reg;

	getbytereq_sig <= '1' when(outvalid_reg = '0') else '0';

	process (clock, reset) begin
		if (reset = '1') then
			outvalid_reg <= '0';

		elsif (clock'event and clock = '1') then
			if (outvalid_reg = '0') then
				if (getbyteack_sig = '1') then
					outdata_reg  <= getbytedata_sig;
					outvalid_reg <= '1';
				end if;
			else
				if (out_ready = '1') then
					outvalid_reg <= '0';
				end if;
			end if;

		end if;
	end process;


	setbytedata_sig <= in_data;
	setbytereq_sig  <= '1' when(in_valid = '1') else '0';

	in_ready <= '1' when(setbyteack_sig = '1') else '0';



	----------------------------------------------
	-- FT245 FIFO�C���^�[�t�F�[�X 
	----------------------------------------------

	ft_rd_n <= not ft_rd_reg;
	ft_wr   <= ft_wr_reg;
	ft_rxf_sig <= not ft_rxf_n;
	ft_txe_sig <= not ft_txe_n;

	getbytedata_sig <= ft_data;
	ft_data <= setbytedata_sig when(ft_doe_reg = '1') else (others=>'Z');

	getbyteack_sig <= '1' when(ifstate = FT_GETBYTE) else '0';
	setbyteack_sig <= '1' when(ifstate = FT_WRWAIT2) else '0';

	process (clock, reset) begin
		if (reset = '1') then
			ifstate <= IDLE;
			ft_doe_reg  <= '0';
			ft_rd_reg   <= '0';
			ft_wr_reg   <= '0';
			ft_rxf_reg  <= "00";
			ft_txe_reg  <= "00";

		elsif (clock'event and clock = '1') then
			ft_rxf_reg <= ft_rxf_reg(0) & ft_rxf_sig;
			ft_txe_reg <= ft_txe_reg(0) & ft_txe_sig;

			case ifstate is
			when IDLE =>
				if (getbytereq_sig = '1' and ft_rxf_reg(1) = '1') then		-- �f�[�^�擾���N�G�X�g 
					ifstate <= FT_RDWAIT1;
					ft_rd_reg <= '1';
				elsif (setbytereq_sig = '1' and ft_txe_reg(1) = '1') then	-- �f�[�^���M���N�G�X�g 
					ifstate <= FT_SETBYTE;
					ft_wr_reg <= '1';
					ft_doe_reg <= '1';
				end if;


			when FT_RDWAIT1 =>					-- �ǂݏo���҂� 
				ifstate <= FT_RDWAIT2;

			when FT_RDWAIT2 =>
				ifstate <= FT_GETBYTE;

			when FT_GETBYTE =>					-- FT245����o�͂����o�C�g���L���v�`�� 
				ifstate <= FT_RXFWAIT;
				ft_rd_reg <= '0';

			when FT_RXFWAIT =>					-- FT245�̓���FIFO�X�V�҂� 
				if (ft_rxf_reg(1) = '0') then
					ifstate <= IDLE;
				end if;


			when FT_SETBYTE =>					-- FT245�փf�[�^�o�� 
				ifstate <= FT_WRWAIT1;

			when FT_WRWAIT1 =>					-- �������ݑ҂� 
				ifstate <= FT_WRWAIT2;
				ft_wr_reg <= '0';

			when FT_WRWAIT2 =>
				ifstate <= FT_TXEWAIT;
				ft_doe_reg <= '0';

			when FT_TXEWAIT =>					-- FT245�̏o��FIFO�X�V�҂� 
				if (ft_txe_reg(1) ='0') then
					ifstate <= IDLE;
				end if;

			end case;

		end if;
	end process;


end RTL;


