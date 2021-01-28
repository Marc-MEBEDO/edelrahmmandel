import React, { Fragment, useState } from 'react';

import PageHeader from 'antd/lib/page-header';
import Breadcrumb from 'antd/lib/breadcrumb';
import Affix from 'antd/lib/affix';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Layout from 'antd/lib/layout';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Card from 'antd/lib/card';
import Button from 'antd/lib/button';
import message from 'antd/lib/message';

const { Content } = Layout;
const { Option } = Select;

import UserAddOutlined from '@ant-design/icons/UserAddOutlined';
import MailOutlined from '@ant-design/icons/MailOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';

import Upload from 'antd/lib/upload';
import ImgCrop from 'antd-img-crop';

import { Avatars } from '../../api/collections/avatars';
import { useAvatar } from '../../client/trackers';

import Compressor from 'compressorjs';

const UploadUserImage = ({ currentUser, onExit }) => {
    const [fileList, setFileList] = useState([
        /*{
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
        },*/
    ]);

    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };
    
    const onPreview = async (file) => {
        let src = file.url;
        if (!src) {
            src = await new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsDataURL(file.originFileObj);
                reader.onload = () => resolve(reader.result);
            });
        }
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow.document.write(image.outerHTML);
    };

    const saveAvatar = file => {
        const newAvatar = fileList[0].originFileObj;

        const uploadImage = file => {
            Avatars.find({ userId: currentUser._id }).remove();
            /*if (oldAvatar) {
                Avatars.remove({ userId: currentUser._id });
            }*/

            const upload = Avatars.insert({
                file,
                streams: 'dynamic',
                chunkSize: 'dynamic',
                meta: { userId: currentUser._id }
            }, false);
        
            upload.on('start', function () {
                //console.log('upload start', this)
            });

            upload.on('end', function (error, fileObj) {
                //console.log('upload end', error, fileObj)
                if (error) {
                    message.error(`Fehler beim Upload: ${error}`);
                    //console.log(`Error during upload: ${error}`);
                } else {
                    console.log(`File successfully uploaded`, fileObj);
                    if (onExit) onExit();
                }
            });

            upload.start();
        }

        //uploadImage(newAvatar);
        new Compressor(newAvatar, {
            maxWidth: 128,
            quality: 0.8,
            success(compressedImage) {
                uploadImage(compressedImage);
            },
            error(err) {
                console.log('compressor-err:', err);
            },
        });
    }

    return (
        <Fragment>
            <ImgCrop quality={1} modalTitle="Bild bearbeiten" maxZoom={5}>
                <Upload
                    action={null}
                    listType="picture-card"
                    fileList={fileList}
                    onChange={onChange}
                    onPreview={onPreview}
                >
                    {fileList.length < 1 && '+ Upload'}
                </Upload>
            </ImgCrop>
            { fileList.length == 1 ? <div style={{width:'100%',padding:16}}><Button type="dashed" size="small" onClick={saveAvatar} >Übernehmen</Button></div> : null }
        </Fragment>
    );
}

const UserImage = ({userId}) => {
    const [ avatarLink, isLoading ] = useAvatar(userId);

    if (isLoading || !avatarLink) {
        return null;
    }

    return (
        <img src={avatarLink} />
    )
}

export class UserProfileForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            userData: props.currentUser.userData,
            editImage: false,
        }

        this.formRef = React.createRef();
    }

    componentDidMount(){
        const form = this.formRef.current;

        form.setFieldsValue(this.state.userData);
    }

    saveProfile(e) {
        const form = this.formRef.current;

        form.validateFields().then(values => {
            Meteor.call('users.updateProfile', values, err => {
                console.log(err);
            });
        });
    }

    editUserimage(e) {
        this.setState({ editImage: true });
    }

    render() {
        const saveProfile = this.saveProfile.bind(this);
        const editUserimage = this.editUserimage.bind(this);

        const { editImage } = this.state;

        return (
            <Fragment>
                <Affix className="mbac-affix-pageheader" offsetTop={0}>
                    <Breadcrumb>
                        <Breadcrumb.Item>Start</Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <a href="/profile">Mein Profil</a>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                    <PageHeader
                        className="site-page-header"
                        title="Mein Profil"
                        onBack={() => history.back()}
                        extra={[
                            <Button key="1" type="primary" onClick={saveProfile}>Speichern</Button>
                        ]}
                    />
                </Affix>

                <Form
                    layout="vertical"
                    ref={this.formRef}
                >
                    <Row gutter={[16,16]/*{xs:4, sm:4, md: 8, lg:16, xl:16}*/} >
                        <Col xs={24} sm={24} md={12} lg={4} xl={4}>
                            <Card 
                                title="Benutzer"
                                bordered={false}
                                cover={
                                    !editImage
                                        ? <UserImage userId={this.props.currentUser._id} />
                                        : <UploadUserImage currentUser={this.props.currentUser} onExit={_=>this.setState({ editImage: false })}/>
                                }
                                extra={[
                                    <EditOutlined key="1" onClick={editUserimage}/>
                                ]}
                            >
                                <span>Foo bar</span>
                            </Card>
                        </Col>
                        <Col xs={24} sm={24} md={12} lg={10} xl={10}>
                            <Card title="Allgemein" bordered={false}>
                                <Form.Item
                                    label="Anrede"
                                    name="gender"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte wählen Sie eine Anrede aus.',
                                    }]}
                                >
                                    <Select style={{width:300}}>
                                        <Option key="Herr">Herr</Option>
                                        <Option key="Frau">Frau</Option>
                                        <Option key="divers">Divers</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Vorname"
                                    name="firstName"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte geben Sie den Vornamen ein.',
                                    }]}
                                >
                                    <Input prefix={<UserAddOutlined />} />
                                </Form.Item>

                                <Form.Item
                                    label="Nachname"
                                    name="lastName"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte geben Sie den Nachnamen ein.',
                                    }]}
                                >
                                    <Input prefix={<UserAddOutlined />} />
                                </Form.Item>

                                <Form.Item
                                    label="E-Mail"
                                    name="email"
                                    rules={[{
                                        type: 'email',
                                        message: 'Bitte geben Sie eine gültige EMail-Adresse ein!',
                                        },{
                                        required: true,
                                        message: 'Bitte geben Sie die EMail-Adresse ein.',
                                    }]}
                                >
                                    <Input prefix={<MailOutlined />} />
                                </Form.Item>

                            </Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={10} xl={10}>
                            <Card title="Erweitert" bordered={false}>
    
                                <Form.Item
                                    label="Firma"
                                    name="company"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte geben Sie den Firmennamen ein.',
                                    }]}
                                >
                                    <Input prefix={null} />
                                </Form.Item>

                                <Form.Item
                                    label="Position"
                                    name="position"
                                >
                                    <Input prefix={null} />
                                </Form.Item>

                                <Form.Item
                                    label="Qualifkation"
                                    name="qualification"
                                >
                                    <Input prefix={null} />
                                </Form.Item>
                                <Form.Item
                                    label="Weiterführende Qualifikation"
                                    name="advancedQualification"
                                >
                                    <Input prefix={null} />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>
                </Form>

            </Fragment>
        );
    }
}