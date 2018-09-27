(function($) {
    'use strict';
    $(document).ready(function(){

		var App = {
			name: "Smart G4",
			dev:  "Axel Roz"
		}

		$(document).on("click", "#delete", function(e){
            let id = $(this).data('delete');
            swal({   
                title: "Are you sure?",   
                text: "You want to delete this user!",   
                type: "warning",   
                showCancelButton: true,   
                confirmButtonColor: "#DD6B55",   
                confirmButtonText: "Yes",   
                cancelButtonText: "No",   
                closeOnConfirm: true,   
                closeOnCancel: true
            }, 
            function(isConfirm){
                if (isConfirm) { 
                    $.ajax({
                        type: 'DELETE',
                        url: window.location.href + '/' + id + '/delete',
                        success: function(data){
                            setTimeout(function(){
                                $("#"+ id).fadeOut(800, function(){
                                    $(this).remove();
                                });
                            }, 500);
                        }, error: function(){
                            alert('Something went wrong');
                        }
                    });
                }
            });
        });

        $(document).on("click", "#delete-hotel", function(e){
            let id = $(this).data('delete');
            swal({   
                title: "Are you sure?",   
                text: "You want to delete this hotel!",   
                type: "warning",   
                showCancelButton: true,   
                confirmButtonColor: "#DD6B55",   
                confirmButtonText: "Yes",   
                cancelButtonText: "No",   
                closeOnConfirm: true,   
                closeOnCancel: true
            }, 
            function(isConfirm){
                if (isConfirm) { 
                    $.ajax({
                        type: 'DELETE',
                        url: window.location.href + '/' + id + '/delete',
                        success: function(data){
                            setTimeout(function(){
                                $("#"+ id).fadeOut(800, function(){
                                    $(this).remove();
                                });
                            }, 500);
                        }, error: function(){
                            alert('Something went wrong');
                        }
                    });
                }
            });
        });

		$('#user-new-form').submit(function(event){
            event.preventDefault();

            let form = $('#user-new-form');
            let username = $('input[name=username]').val();
            let password = $('input[name=password]').val();
            let confirmPassword = $('input[name=confirm-password]').val();
            let room = $('select[name=room]').val();

            if(password == confirmPassword){
                $.ajax({
                    url: form.prop('action'),
                    type: 'POST',
                    dataType: 'JSON',
                    data: {
                        username: username,
                        password: password,
                        room: room
                    },
                    success: function (data){
                        window.location.href = '/users';
                    },
                    error: function (err){
                        swal({
                            type: "error",   
                            title: "Opss!",
                            text: "Something went wrong!"
                        });
                    }
                });
            }else{
                swal({
                    type: "error",   
                    title: "Password Mismatch!"
                });
            }
        });

        $('#user-edit-form').submit(function(event){
            event.preventDefault();

            $("#user-edit-form :submit").html("Loading...");
            $("#user-edit-form :submit").attr("disabled", true);

            let form = $('#user-edit-form');
            let room = $('select[name=room]').val();
            let status = $('select[name=status]').val();

            $.ajax({
                url: form.prop('action'),
                type: 'PUT',
                dataType: 'JSON',
                data: {
                    room: room,
                    status: status
                },
                success: function (data){
                    window.location.href = '/users';
                },
                error: function (err){
                    alert('Something went wrong');
                    $("#user-edit-form :submit").html("<i class='fa fa-check'></i> Update");
                    $("#user-edit-form :submit").attr("disabled", false);
                }
            });
        });

        $('#user-change-password-form').submit(function(event){
            event.preventDefault();

            $("#user-change-password-form :submit").html("Loading...");
            $("#user-change-password-form :submit").attr("disabled", true);

            let form = $('#user-change-password-form');
            let password = $('input[name=password]').val();
            let confirmPassword = $('input[name=confirm-password]').val();
            
            if(password == confirmPassword){
                $.ajax({
                    url: form.prop('action'),
                    type: 'PUT',
                    dataType: 'JSON',
                    data: {
                        password: password,
                    },
                    success: function (data){
                        window.location.href = '/users';
                    },
                    error: function (err){
                        alert('Something went wrong');
                        $("#user-change-password-form :submit").html("<i class='fa fa-check'></i> Change Password");
                        $("#user-change-password-form :submit").attr("disabled", false);
                    }
                });
            }else{
                alert('Password Mismatch');
                $("#user-change-password-form :submit").html("<i class='fa fa-check'></i> Change Password");
                $("#user-change-password-form :submit").attr("disabled", false);
            }
        });

        $('#hotel-new-form').submit(function(event){
        	event.preventDefault();

        	let form = $('#hotel-new-form');
            let name = $('input[name=hotel-name]').val();
            let abrr = $('input[name=hotel-abrr]').val();
            let endpoint = $('input[name=smart-g4-proxy-endpoint]').val();

            $.ajax({
            	url: form.prop('action'),
                type: 'POST',
                dataType: 'JSON',
                data: {
                    name: name,
                    abrr: abrr,
                    endpoint: endpoint
                },
                success: function (data){
                    window.location.href = '/hotels';
                },
                error: function (err){
                    swal({
                        type: "error",   
                        title: "Opss!",
                        text: "Something went wrong!"
                    });
                }
            });
        });

        $('#hotel-admin-new-form').submit(function(event){
            event.preventDefault();

            let form = $('#hotel-admin-new-form');
            let hotel = $('input[name=hotel]').val();
            let first_name = $('input[name=first-name]').val();
            let last_name = $('input[name=last-name]').val();
            let email_address = $('input[name=email-address]').val();
            let username = $('input[name=username]').val();

            $.ajax({
                url: form.prop('action'),
                type: 'POST',
                dataType: 'JSON',
                data: {
                    hotel: hotel,
                    first_name: first_name,
                    last_name: last_name,
                    email_address: email_address,
                    username: username
                },
                success: function (data){
                    swal({
                        type: "info",   
                        title: data,
                        text: "Please Takenote or Remember this Password!"
                    },
                    function(isConfirm){
                        window.location.href = '/hotels/' + hotel + '/show';
                    });
                },
                error: function (err){
                    swal({
                        type: "error",   
                        title: "Opss!",
                        text: "Something went wrong!"
                    });
                }
            });
        });

        $('#hotel-edit-form').submit(function(event){
            event.preventDefault();

            $("#hotel-edit-form :submit").html("Loading...");
            $("#hotel-edit-form :submit").attr("disabled", true);

            let form = $('#hotel-edit-form');
            let name = $('input[name=hotel-name]').val();
            let endpoint = $('input[name=endpoint]').val();
            let status = $('select[name=status]').val();

            $.ajax({
                url: form.prop('action'),
                type: 'PUT',
                dataType: 'JSON',
                data: {
                    name: name,
                    endpoint: endpoint,
                    status: status
                },
                success: function (data){
                    window.location.href = '/hotels';
                },
                error: function (err){
                    //alert('Something went wrong');
                    $("#hotel-edit-form :submit").html("<i class='fa fa-check'></i> Update");
                    $("#hotel-edit-form :submit").attr("disabled", false);
                }
            });
        });

        $('#generate-client-id').click(function(event){
            let id = $(this).data('hotel');

            $("#generate-client-id").html("Generating...");
            $("#generate-client-id").attr("disabled", true);
            
            $.ajax({
                url: '/hotels/' + id + '/g/client-id',
                type: 'PUT',
                success: function (data){
                    $('#hotel-client-id').html(data);
                    swal({
                        type: "success",   
                        title: data,
                        text: "New Client ID Generated"
                    });
                    $("#generate-client-id").html("<i class='fa fa-cogs'></i> Generate New Client ID");
                    $("#generate-client-id").attr("disabled", false);
                },
                error: function (err){
                    $("#generate-client-id").html("<i class='fa fa-cogs'></i> Generate New Client ID");
                    $("#generate-client-id").attr("disabled", false);
                }
            });
        });
		
	});
})(window.jQuery);